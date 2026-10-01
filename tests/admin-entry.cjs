const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',r=>new URL(r.request().url()).pathname==='/' ? r.fulfill({contentType:'text/html',body:html}) : r.abort());
  await page.goto('https://test.invalid/?lang=ru&view=admin');
  await page.evaluate(()=>{
   window.calls=[];
   api=async p=>{calls.push(p);if(p==='/me')return{is_admin:true};if(p==='/drivers?summary=1')return new Promise(resolve=>window.releaseList=resolve);throw Error('unexpected '+p);};
   window.loadingAdmin=init();
  });
  await page.waitForFunction(()=>typeof releaseList==='function');
  assert(await page.locator('#screen-drivers').evaluate(e=>e.classList.contains('active')));
  assert.match(await page.locator('#driver-list').textContent(),/Загружаем/);
  await page.evaluate(async()=>{releaseList([{id:'1',name:'Test Renter',car_number:'TEST',file_count:null}]);await loadingAdmin;});
  assert.match(await page.locator('#driver-list').textContent(),/Test Renter/);
  assert(!(await page.evaluate(()=>calls)).includes('/driver/me'));
  await page.evaluate(async()=>{api=async()=>{throw Error('Offline');};await openAdminHome();});
  assert(await page.getByRole('button',{name:'Повторить',exact:true}).isVisible());
  await page.evaluate(async()=>{calls=[];api=async p=>{calls.push(p);if(p==='/me')return{is_admin:false};if(p==='/driver/me')return{driver:{name:'Normal renter'},files:[],mileage:{}};throw Error(p);};await init();});
  assert(!(await page.evaluate(()=>calls)).some(p=>p.startsWith('/drivers')));
  assert(await page.locator('#dv-administration').evaluate(e=>e.hidden));
  assert(await page.locator('#screen-driver-home').evaluate(e=>e.classList.contains('active')));
  console.log('PASS: admin direct entry, immediate loading, retry, ordinary renter isolation');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
