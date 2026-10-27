param(
 [Parameter(Mandatory=$true)][string]$DllPath,
 [string]$EphemerisPath = '',
 [string]$OutputPath = 'jqa3-dll-benchmark.json'
)
$ErrorActionPreference='Stop'
if ([IntPtr]::Size -ne 4) { throw 'Run with 32-bit PowerShell (SysWOW64), not 64-bit.' }
$DllPath=(Resolve-Path -LiteralPath $DllPath).Path
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class Jqa3Win32 {
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr LoadLibraryW(string filename);
  [DllImport("kernel32.dll", CharSet=CharSet.Ansi, SetLastError=true)] public static extern IntPtr GetProcAddress(IntPtr module, string function);
  [UnmanagedFunctionPointer(CallingConvention.StdCall, CharSet=CharSet.Ansi)] public delegate IntPtr Version(StringBuilder destination);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate double Julian(int year,int month,int day,double hours,int gregorian);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate void SidMode(int mode,double epoch,double ayanamsa);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate void EphePath([MarshalAs(UnmanagedType.LPStr)] string path);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate int Calc(double jd,int body,int flags,[Out] double[] values,StringBuilder error);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate int Houses(double jd,double lat,double lon,int system,[Out] double[] cusps,[Out] double[] ascmc);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] public delegate double Ayanamsa(double jd);
}
'@
$module=[Jqa3Win32]::LoadLibraryW($DllPath)
if($module -eq [IntPtr]::Zero){throw ('Cannot load DLL: '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
function Link-Native([string]$name,[int]$stack,[type]$delegate){
  $candidates=@("_${name}@${stack}","$name")
  foreach($candidate in $candidates){
    $pointer=[Jqa3Win32]::GetProcAddress($module,$candidate)
    if($pointer -ne [IntPtr]::Zero){
      return [Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer($pointer,$delegate)
    }
  }
  $known=[Jqa3Win32]::GetProcAddress($module,'_swe_version@4')
  throw ('Missing DLL symbol: '+$name+' stack='+$stack+' tried='+($candidates -join ',')+' knownVersionPtr='+$known)
}
$versionFn=Link-Native 'swe_version' 4 ([Jqa3Win32+Version])
$julianFn=Link-Native 'swe_julday' 24 ([Jqa3Win32+Julian])
$sidFn=Link-Native 'swe_set_sid_mode' 20 ([Jqa3Win32+SidMode])
$epheFn=Link-Native 'swe_set_ephe_path' 4 ([Jqa3Win32+EphePath])
$calcFn=Link-Native 'swe_calc_ut' 24 ([Jqa3Win32+Calc])
$houseFn=Link-Native 'swe_houses' 36 ([Jqa3Win32+Houses])
$ayanFn=Link-Native 'swe_get_ayanamsa_ut' 8 ([Jqa3Win32+Ayanamsa])
$v=New-Object System.Text.StringBuilder 200
[void]$versionFn.Invoke($v)
if($EphemerisPath){
 $EphemerisPath=(Resolve-Path -LiteralPath $EphemerisPath).Path
 $epheFn.Invoke($EphemerisPath)
}
$sidFn.Invoke(1,0.0,0.0) # Swiss sidereal Lahiri
$rows=@()
$expectedExe='3ddbe5fb0458ad1f0ad91b002c7efb8bba9f08891d3f46190aba97d570b17908'
function Arc-Delta([double]$actual,[double]$expected){
  $difference=($actual-$expected+540.0)%360.0
  if($difference -lt 0){$difference+=360.0}
  return ($difference-180.0)*3600.0
}
foreach($i in 1..20){
 $id='jqa3-{0:00}' -f $i
 $source=Get-Content (Join-Path $root ('tests/fixtures/jhora-corpus/'+$id+'.json')) -Raw | ConvertFrom-Json
 if($source.independentSource.capture.jhoraExeSha256 -ne $expectedExe){throw ('Unmatched frozen JHora source: '+$id)}
 $when=[DateTimeOffset]::Parse($source.civilTime.birthUtc,[Globalization.CultureInfo]::InvariantCulture)
 $hours=$when.Hour+$when.Minute/60.0+$when.Second/3600.0
 $jd=$julianFn.Invoke($when.Year,$when.Month,$when.Day,$hours,1)
 $houses=New-Object 'double[]' 13
 $angles=New-Object 'double[]' 10
 $houseCode=[int][char]'P'
 $houseStatus=$houseFn.Invoke($jd,[double]$source.civilTime.latitude,[double]$source.civilTime.longitude,$houseCode,$houses,$angles)
 if($houseStatus -lt 0){throw ('Swiss house failure '+$id)}
 $ayan=$ayanFn.Invoke($jd) # historical API mean Lahiri
 $asc=($angles[0]-$ayan+360.0)%360.0
 $moon=New-Object 'double[]' 6
 $errorBuffer=New-Object System.Text.StringBuilder 256
 $returnedFlags=$calcFn.Invoke($jd,1,(2 -bor 65536 -bor 256),$moon,$errorBuffer)
 if($returnedFlags -lt 0){throw ('Swiss lunar failure '+$id+': '+$errorBuffer.ToString())}
 $rL=Arc-Delta $asc ([double]$source.expected.positions.Lagna.longitude)
 $rM=Arc-Delta $moon[0] ([double]$source.expected.positions.Moon.longitude)
 $rows+= [ordered]@{
   id=$id;lagnaResidualArcseconds=$rL;moonResidualArcseconds=$rM
   lagnaPass=([Math]::Abs($rL) -le 1.0);moonPass=([Math]::Abs($rM) -le 1.0)
   returnedEphemerisFlags=$returnedFlags
   actualSwissBackend=($(if(($returnedFlags -band 7) -eq 2){'SWIEPH'}elseif(($returnedFlags -band 7) -eq 4){'MOSEPH'}else{'OTHER'}))
   error=$errorBuffer.ToString()
 }
}
$lagnaPass=@($rows|Where-Object {$_.lagnaPass}).Count
$moonPass=@($rows|Where-Object {$_.moonPass}).Count
$backends=@($rows|Select-Object -ExpandProperty actualSwissBackend -Unique)
$report=[ordered]@{
 status='DIAGNOSTIC_ONLY'
 libraryVersion=$v.ToString();dllSha256=(Get-FileHash -LiteralPath $DllPath -Algorithm SHA256).Hash.ToLowerInvariant()
 DLLIsKnownJHoraSource=$false
 method='tropical swe_houses ASC - historical mean Lahiri; Moon SWIEPH sidereal requested'
 backendMethods=$backends
 results=[ordered]@{lagnaPass=$lagnaPass;moonPass=$moonPass;total=20}
 passRequiresSameCapturedJHoraExeAndMethod=$true
 rows=$rows
}
$path=[IO.Path]::GetFullPath($OutputPath)
$report|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $path -Encoding UTF8
Write-Host ('DLL '+$report.libraryVersion+' SHA256='+$report.dllSha256)
Write-Host ('20-source parity: Lagna '+$lagnaPass+'/20, Moon '+$moonPass+'/20. Backend: '+($backends -join ', '))
Write-Host ('Diagnostic output: '+$path)
