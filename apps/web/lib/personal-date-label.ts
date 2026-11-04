/** Civil-date labels use the server user's IANA-local YYYY-MM-DD strings.
 * Using UTC only for formatting prevents the browser's time zone shifting the day.
 */
import type {PortalLocale} from './brand';
const civilMs=(iso:string)=>Date.parse(iso+'T00:00:00Z');
export function calendarDayLabel(day:string,today:string,locale:PortalLocale):string{
 const delta=(civilMs(day)-civilMs(today))/86400000;
 if(delta===0)return locale==='uk'?'Сьогодні':'Today';
 if(delta===-1)return locale==='uk'?'Вчора':'Yesterday';
 if(delta===1)return locale==='uk'?'Завтра':'Tomorrow';
 return new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-US',
  {day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(civilMs(day)));
}
