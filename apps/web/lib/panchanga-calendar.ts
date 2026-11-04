/** Civil calendar arithmetic deliberately uses UTC dates, not observer-local
 * midnight arithmetic. Observer zone only chooses astronomy instants.
 */
const DAY=86400000;
export type Period='week'|'month';
export type CalendarFilter='all'|'festivals'|'phases';
export function civilMonth(date:string){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
 if(!m||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||
  new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
  throw Error('Invalid Gregorian calendar date');
 return {year:Number(m[1]),month:Number(m[2]),day:Number(m[3])};
}
export function calendarWindow(anchor:string,period:Period){
 const {year,month}=civilMonth(anchor);
 if(period==='week')return {start:anchor,days:7};
 return {start:year+'-'+String(month).padStart(2,'0')+'-01',
  days:new Date(Date.UTC(year,month,0)).getUTCDate()};
}
export function moveCalendar(anchor:string,period:Period,direction:-1|1){
 const {year,month,day}=civilMonth(anchor);
 if(period==='week')return new Date(Date.parse(anchor+'T00:00:00Z')+
  direction*7*DAY).toISOString().slice(0,10);
 const shifted=new Date(Date.UTC(year,month-1+direction,1));
 const last=new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth()+1,0)).getUTCDate();
 shifted.setUTCDate(Math.min(day,last));
 return shifted.toISOString().slice(0,10);
}
export function validOverviewWindow(start:string,days:number){
 if(!Number.isInteger(days)||days<1||days>31)return false;
 const last=Date.parse(start+'T00:00:00Z')+(days-1)*DAY;
 return start>='1900-01-01'&&start<='2099-11-01'&&Number.isFinite(last)&&
  new Date(last).toISOString().slice(0,10)<='2099-12-31';
}
export type Marker={kind:string;atUtc:string;localDate:string};
export function markerCountForDay(date:string,observances:readonly unknown[],phases:readonly Marker[]){
 const phaseCount=phases.filter(p=>p.localDate===date).length;
 return {candidateCount:observances.length,phaseCount};
}
