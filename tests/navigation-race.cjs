const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=process.env.TEST_HTML||path.join(__dirname,'../index.html');
const html=fs.readFileSync(source,'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',r=>new URL(r.request().url()).pathname==='/'?r.fulfill({contentType:'text/html',body:html}):r.abort());
  await page.goto('https://test.invalid/?lang=ru');
  for(const fail of [false,true]) {
   await page.evaluate(()=>{
    state.isAdmin=true;
    state.currentDriver={id:'2',name:'Other renter'};state.currentFiles=[];
    api=()=>new Promise((resolve,reject)=>{window.finishOwn=resolve;window.failOwn=reject;});
    window.pendingOwn=loadDriverHome();openDriverPreview();
   });
   await page.evaluate(async fail=>{
    if(fail)failOwn(Error('Late network error'));else finishOwn({driver:{id:'1',name:'Owner'},files:[]});
    await pendingOwn;
   },fail);
   assert.equal(await page.locator('#dv-name').textContent(),'Other renter','late owner response must not replace renter');
   assert(await page.locator('#screen-driver-home').evaluate(e=>e.classList.contains('active')));
   assert(await page.evaluate(()=>state.dvPreview));
  }
  await page.evaluate(()=>{
   api=p=>p==='/me'?Promise.resolve({is_admin:true}):new Promise(resolve=>window.finishInit=resolve);
   window.pendingInit=init();
  });
  await page.waitForFunction(()=>typeof finishInit==='function');
  await page.evaluate(async()=>{openDriverPreview();finishInit({driver:{name:'Owner'},files:[]});await pendingInit;});
  assert.equal(await page.locator('#dv-name').textContent(),'Other renter');
  await page.evaluate(()=>{
   api=()=>new Promise(resolve=>window.finishCard=resolve);window.pendingCard=openDriver('3');showScreen('drivers');
  });
  await page.evaluate(async()=>{finishCard({driver:{id:'3',name:'Late renter'},files:[]});await pendingCard;});
  assert(await page.locator('#screen-drivers').evaluate(e=>e.classList.contains('active')));
  await page.evaluate(async()=>{api=async()=>({driver:{id:'1',name:'Owner'},files:[]});await loadDriverHome();});
  assert.equal(await page.locator('#dv-name').textContent(),'Owner');
  assert.equal(await page.evaluate(()=>state.dvPreview),false);
  console.log('PASS: stale owner success/error, startup, renter response cannot navigate; explicit owner entry works');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
