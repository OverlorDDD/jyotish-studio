/** One step of the guided path through a page: scroll the next element into view,
 * light it up briefly (data-gx-attention, styled by the page) and optionally focus it. */
export function guideTo(id:string,options:{focus?:boolean;block?:ScrollLogicalPosition;delay?:number}={}){
 const run=()=>{
  const el=document.getElementById(id);
  if(!el)return;
  const reduce=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior:reduce?'auto':'smooth',block:options.block??'center'});
  el.removeAttribute('data-gx-attention');
  void el.offsetWidth;
  el.setAttribute('data-gx-attention','1');
  window.setTimeout(()=>el.removeAttribute('data-gx-attention'),2400);
  if(options.focus)(el as HTMLElement).focus({preventScroll:true});
 };
 if(options.delay)window.setTimeout(run,options.delay);else run();
}
