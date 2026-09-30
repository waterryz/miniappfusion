const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.FEEDBACK_OUTPUT || path.join(__dirname,'feedback-results');
fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'').replace('</head>','<style>'+fs.readFileSync(path.join(root,'cabinet-identity.css'),'utf8')+'</style></head>');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
 const results=[];
 try {
  for(const lang of ['ru','en']) {
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>{
    const u=new URL(r.request().url());
    if(u.pathname==='/')return r.fulfill({contentType:'text/html',body:html});
    if(u.pathname.startsWith('/assets/'))return r.fulfill({path:path.join(root,u.pathname)});
    return r.abort();
   });
   await page.goto('https://miniapp.test/?lang='+lang);
   await page.evaluate(async()=>{
    window.feedbackCalls=[];
    window.demoDriver={id:'101',name:'Alex Morgan',avatar:'man-2',header_theme:'brass',car_model:'Toyota Sienna Hybrid (WAV)',car_year:'2025',car_trim:'XLE Plus',car_number:'T000000C'};
    api=async(p,o={})=>{
     feedbackCalls.push([p,o.method||'GET']);
     if(p==='/me')return {is_admin:true};
     if(p==='/driver/me')return {driver:demoDriver,files:[],mileage:{}};
     if(p==='/driver/me/preferences'){Object.assign(demoDriver,JSON.parse(o.body));return {...demoDriver};}
     if(p==='/drivers')return [demoDriver];
     return {};
    };
    await init();
   });
   assert(await page.locator('#screen-driver-home').evaluate(e=>e.classList.contains('active')));
   assert(await page.locator('#dv-administration').isVisible());
   assert(await page.locator('#dv-customize summary').first().isVisible());
   await page.locator('#dv-customize summary').first().click();
   await page.locator('#profile-nickname').fill('Road Captain');
   await page.locator('#profile-theme').selectOption('steel');
   await page.locator('#profile-avatar').selectOption('man-3');
   await page.locator('#profile-save').click();
   await page.waitForFunction(()=>document.getElementById('profile-status').textContent===(RU?'Сохранено':'Saved'));
   await page.evaluate(()=>loadDriverHome());
   assert.equal(await page.locator('#profile-nickname').inputValue(),'Road Captain');
   assert.equal(await page.locator('#profile-theme').inputValue(),'steel');
   assert.equal(await page.locator('#profile-avatar').inputValue(),'man-3');
   await page.evaluate(()=>{document.getElementById('dv-customize').open=false;});
   await page.locator('#dv-administration').click();
   assert(await page.locator('#screen-drivers').evaluate(e=>e.classList.contains('active')));
   await page.locator('#admin-own-account').click();
   assert(await page.locator('#dv-customize').isVisible());
   for(const width of [320,390,430]) {
    await page.setViewportSize({width,height:844});
    for(const theme of ['brass','steel','wood']) {
     await page.evaluate(theme=>{
      state.currentDriver={...demoDriver,header_theme:theme};state.currentFiles=[];
      openDriverPreview();document.getElementById('screen-driver-home').scrollTop=0;
     },theme);
     const layout=await page.evaluate(()=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {back:rect('#dv-back'),plate:rect('.pf-hero'),logo:rect('.pf-identity-brand img'),overflow:document.documentElement.scrollWidth>innerWidth,settingsHidden:document.getElementById('dv-customize').hidden};
     });
     assert(layout.back.bottom+8<=layout.plate.y);
     assert(layout.back.height>=48);
     assert(layout.logo.width>=56);
     assert(!layout.overflow);
     assert(layout.settingsHidden);
     if(width===390)await page.screenshot({path:path.join(out,`${lang}-${theme}-preview.png`)});
     results.push({lang,width,theme,...layout});
    }
   }
   await page.locator('#dv-open-own').click();
   assert(await page.locator('#dv-customize').isVisible());
   assert(!(await page.locator('#dv-preview-notice').isVisible()));
   await page.setViewportSize({width:390,height:844});
   await page.locator('#dv-customize summary').first().click();
   await page.screenshot({path:path.join(out,`${lang}-settings.png`)});
   assert.deepEqual(errors,[]);
   // Admin without an assigned account still reaches administration. Auth errors do not bypass login.
   await page.evaluate(async()=>{api=async p=>{if(p==='/me')return{is_admin:true};if(p==='/driver/me')throw Object.assign(new Error('No driver'),{status:404});if(p==='/drivers')return [];return {};};await init();});
   assert(await page.locator('#screen-drivers').evaluate(e=>e.classList.contains('active')));
   await page.evaluate(async()=>{api=async p=>{if(p==='/me')return{is_admin:true};throw Object.assign(new Error('Expired'),{status:401});};await init();});
   assert(await page.locator('#screen-wip').evaluate(e=>e.classList.contains('active')));
   await page.close();
  }
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(results,null,2));
  console.log('PASS: owner settings/save/reload, admin navigation, preview isolation, 18 mobile layouts, authentication fallback.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
