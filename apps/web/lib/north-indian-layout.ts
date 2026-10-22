/**
 * North Indian / diamond chart: stable geometric anchors in a 360² SVG.
 * A house's number, sign and graha stack share one anchor and center vertically
 * as a single cluster. No translated strings are used for geometry.
 */
export type PlanetPosition={name:string;house:number;sign:number;degreesInSign:number;retrograde:boolean};
export type HouseLayout={house:number;x:number;y:number;kind:'large'|'corner';numberOfRows:number;shown:PlanetPosition[];hidden:number;top:number;lineHeight:number;metaY:number};
export const CHART_SIZE=360;
export const CHART_HOUSES=Object.freeze([
 {x:180,y:88,kind:'large'},  // first house, upper diamond
 {x:90,y:46,kind:'corner'}, {x:46,y:90,kind:'corner'},
 {x:88,y:180,kind:'large'}, {x:46,y:270,kind:'corner'},
 {x:90,y:314,kind:'corner'}, {x:180,y:272,kind:'large'},
 {x:270,y:314,kind:'corner'}, {x:314,y:270,kind:'corner'},
 {x:272,y:180,kind:'large'}, {x:314,y:90,kind:'corner'},
 {x:270,y:46,kind:'corner'},
] as const);
export const SIGN_GLYPHS=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'] as const;
export const PLANET_GLYPHS:Record<string,string>={Sun:'☉︎',Moon:'☽︎',Mars:'♂︎',Mercury:'☿︎',Jupiter:'♃︎',Venus:'♀︎',Saturn:'♄︎',Rahu:'☊︎',Ketu:'☋︎'};
export function layoutHouses(planets:readonly PlanetPosition[]):HouseLayout[]{
 return CHART_HOUSES.map((slot,index)=>{
  const house=index+1,full=planets.filter(p=>p.house===house&&p.name!=='Ascendant');
  const max=slot.kind==='corner'?3:6;
  const shown=full.slice(0,max),hidden=Math.max(0,full.length-shown.length);
  // Compact corner houses use smaller leading so labels never cross a border.
  const lineHeight=slot.kind==='corner'?11.5:13;
  const numberOfRows=shown.length+(hidden?1:0);
  const height=17+numberOfRows*lineHeight;
  const top=slot.y-height/2;
  return {house,x:slot.x,y:slot.y,kind:slot.kind,shown,hidden,numberOfRows,top,lineHeight,metaY:top+8};
 });
}
