import {test,expect} from '@playwright/test';
for(const lang of ['en','uk']){
 test(lang+' natal page: user-first heading, SEO canonical, free tool and inline minute accuracy',async({page})=>{
  await page.goto('/'+lang+'/astrology/jyotish');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.getByRole('heading',{level:1})).toContainText(lang==='uk'?'16 карт життя':'16 life charts',{ignoreCase:true});
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp('/'+lang+'/astrology/jyotish$'));
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',/16|birth chart|натальн/);
  await expect(page.getByRole('link',{name:lang==='uk'?'Створити мої 16 карт життя':'Create my 16 life charts'})).toHaveAttribute('href','#birth-details');
  await expect(page.locator('input[type=date]')).toHaveValue('');
  await expect(page.locator('input[type=time]')).toHaveValue('');
  await expect(page.getByTestId('n4-rc-explorer')).toContainText('16');
  await expect(page.getByTestId('n41-all-charts').getByRole('button')).toHaveCount(16);
  await expect(page.getByTestId('n4-rc-additional')).toHaveCount(0);
  const sky=page.getByTestId('n41-sky');
  await expect(sky).toBeVisible();
  // N4.1.1: astronomy art has no UI buttons, fake Dn labels, or cropped polygon layers.
  await expect(sky.getByRole('button')).toHaveCount(0);
  await expect(sky.locator('canvas')).toBeVisible();
  await expect(sky.getByText('D27')).toHaveCount(0);
  await expect(sky.getByText('D9')).toHaveCount(0);
  const astronomy=await sky.locator('canvas').evaluate(el=>{
   const canvas=el;
   const rect=canvas.getBoundingClientRect();
   const frame=canvas.parentElement.getBoundingClientRect();
   const ctx=canvas.getContext('2d');
   const px=ctx.getImageData(Math.round(canvas.width*320/640),Math.round(canvas.height*310/620),1,1).data;
   return {drawn:px[3]>0,aligned:Math.abs(rect.left-frame.left)<=2&&Math.abs(rect.right-frame.right)<=2,
    ratio:Math.abs(rect.width/rect.height-640/620)<.025};
  });
  expect(astronomy.drawn,'Sun must be at the common centre of the heliocentric drawing').toBeTruthy();
  expect(astronomy.aligned,'canvas should stay within its scene').toBeTruthy();
  expect(astronomy.ratio,'celestial artwork must stay proportional').toBeTruthy();
  await expect(page.locator('.as-brand-icon img')).toHaveCount(1);
  expect(await page.locator('.as-brand-icon img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await expect(page.getByText(lang==='uk'?'Навіщо досліджувати 16 карт життя?':'What can 16 life charts help you explore?')).toBeVisible();
  await expect(page.locator('#natal-faq-title')).toBeVisible();
  await expect(page.locator('input[type=checkbox]')).toHaveCount(1);
  await page.locator('input[type=checkbox]').check();
  await expect(page.getByText(lang==='uk'?'Без точних хвилин':'Without exact minutes',{exact:false})).toBeVisible();
 });
}
test('natal landing responds without horizontal overflow from 320 to 1440px',async({page})=>{
 await page.goto('/en/astrology/jyotish');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'natal landing viewport overflow '+width+'px').toBeLessThanOrEqual(2);
 }
});


test('Save-chart toolbar scrolls underneath sticky navigation instead of covering Login',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/uk/astrology/jyotish');
 const header=page.locator('.as-header');
 const account=page.locator('.jy-portal-toolbar .account-trigger');
 await expect(header).toBeVisible();
 await expect(account).toBeVisible();
 const layers=await page.evaluate(()=>{
  const toolbar=document.querySelector('.jy-portal-toolbar');
  const sticky=document.querySelector('.as-header');
  return {isolated:toolbar?getComputedStyle(toolbar).isolation==='isolate':false,
    toolbarZ:toolbar?Number(getComputedStyle(toolbar).zIndex):NaN,
    headerZ:sticky?Number(getComputedStyle(sticky).zIndex):NaN};
 });
 expect(layers.isolated).toBeTruthy();
 expect(layers.toolbarZ).toBeLessThan(layers.headerZ);
 await page.evaluate(()=>{
  document.documentElement.style.scrollBehavior='auto';
  window.scrollTo(0,160);
 });
 const hit=await account.evaluate(button=>{
  const sticky=document.querySelector('.as-header');
  if(!sticky)return false;
  const r=button.getBoundingClientRect(),h=sticky.getBoundingClientRect();
  const x=Math.max(r.left+2,Math.min(r.right-2,(r.left+r.right)/2));
  const y=Math.max(r.top+2,Math.min(r.bottom-2,(r.top+r.bottom)/2));
  if(y<h.top||y>h.bottom)return true;
  const front=document.elementFromPoint(x,y);
  return front===sticky||sticky.contains(front);
 });
 expect(hit,'save chart must not paint on top of the sticky site header').toBeTruthy();
});


test('Hero Scene v4: Sun-centred orbits, Earth Moon and ten consistent hover names',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/en/astrology/jyotish');
 const sky=page.getByTestId('n41-sky'),canvas=sky.locator('canvas');
 await expect(canvas).toBeVisible();
 await expect(sky.getByRole('button')).toHaveCount(0);
 const live=sky.getByTestId('n41-hovered-planet');
 await expect(live).toBeEmpty();
 await expect(sky).toHaveAttribute('data-orbit-model','heliocentric-schematic');
 const orbitalBodies=[
  {name:'MERCURY',radius:62,e:.2056,angle:-2.37},
  {name:'VENUS',radius:96,e:.0068,angle:.61},
  {name:'EARTH',radius:130,e:.0167,angle:2.54},
  {name:'MARS',radius:163,e:.0934,angle:-.70},
  {name:'JUPITER',radius:201,e:.0489,angle:1.94},
  {name:'SATURN',radius:233,e:.0565,angle:-2.27},
  {name:'URANUS',radius:258,e:.0472,angle:-.16},
  {name:'NEPTUNE',radius:281,e:.0086,angle:1.20}
 ];
 const pos=b=>({name:b.name,x:320-b.radius*b.e+Math.cos(b.angle)*b.radius,
  y:310+Math.sin(b.angle)*b.radius*Math.sqrt(1-b.e*b.e)*.79});
 const earth=pos(orbitalBodies.find(b=>b.name==='EARTH'));
 const bodies=[
  {name:'SUN',x:320,y:310},
  ...orbitalBodies.map(pos),
  {name:'MOON',x:earth.x+23,y:earth.y-10.5}
 ];
 for(const body of bodies){
  const rect=await canvas.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect.x+body.x/640*rect.width,rect.y+body.y/620*rect.height,{steps:6});
  await expect(live,'missing hover label for '+body.name).toHaveText(body.name,{timeout:4000});
  await page.mouse.move(rect.x+4,rect.y+4,{steps:5});
  await expect(live,'hover label should disappear when not on a planet').toBeEmpty();
 }
 const r=await canvas.boundingBox();
 await page.mouse.move(r.x+r.width*.92,r.y+r.height*.5,{steps:2});
 const early=Number(await canvas.getAttribute('data-parallax-x'));
 await page.waitForTimeout(200);
 const later=Number(await canvas.getAttribute('data-parallax-x'));
 expect(Number.isFinite(early)&&Number.isFinite(later)).toBeTruthy();
 expect(later,'pointer movement must be eased instead of snapping to target').toBeGreaterThan(early);
 expect(later,'smoothing must not jump immediately to the pointer target').toBeLessThan(1);
 await page.mouse.move(r.x-10,r.y-10);
 await expect(live).toBeEmpty();
});

test('Hero Scene v4: reduced motion stays still but heliocentric bodies are hoverable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/uk/astrology/jyotish');
 const canvas=page.getByTestId('n41-sky').locator('canvas');
 const live=page.getByTestId('n41-hovered-planet');
 await expect(canvas).toBeVisible();
 const r=await canvas.boundingBox();
 expect(r).not.toBeNull();
 await page.mouse.move(r.x+r.width*320/640,r.y+r.height*310/620);
 await expect(live).toHaveText('SUN');
 await expect(canvas).toHaveAttribute('data-parallax-x','0');
 await page.mouse.move(r.x-5,r.y-5);
 await expect(live).toBeEmpty();
});
