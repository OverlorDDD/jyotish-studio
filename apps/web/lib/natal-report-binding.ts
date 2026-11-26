/** Bind the visible natal chart and the independent report to the same trusted server computation.
 * Never accept a client-supplied digest or a server report for different birth input.
 * A valid stale chart can be replaced only by the verified chart that produced the report. */
export type NatalBirthIdentity={
 date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string;
};
export type NatalChartIdentity={
 input:NatalBirthIdentity;
 verification?:{version:string;status:string;digest:string};
};
export type NatalReportIdentity<T extends NatalChartIdentity>={
 verification?:{version:string;status:string;digest:string};
 verifiedChart?:T;
};
const validDigest=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const sameBirth=(a:NatalBirthIdentity,b:NatalBirthIdentity)=>a.date===b.date&&a.time===b.time&&
 a.timeZone===b.timeZone&&a.latitude===b.latitude&&a.longitude===b.longitude&&
 (a.place||'')===(b.place||'');
export function resolveVerifiedReportChart<T extends NatalChartIdentity>(
 current:T,report:NatalReportIdentity<T>,isVerifiedChart:(value:T)=>boolean
):{chart:T;rebound:boolean}{
 const proof=report.verification;
 if(proof?.version!=='jyotish-integrity-v3'||proof.status!=='verified_internal'||!validDigest(proof.digest))
  throw Error('report_verification_invalid');
 if(!isVerifiedChart(current))throw Error('current_chart_unverified');
 if(current.verification?.digest===proof.digest)return {chart:current,rebound:false};
 const canonical=report.verifiedChart;
 if(!canonical||!isVerifiedChart(canonical)||
  canonical.verification?.digest!==proof.digest||!sameBirth(current.input,canonical.input))
  throw Error('report_chart_mismatch');
 return {chart:canonical,rebound:true};
}
