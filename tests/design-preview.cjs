const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../../outputs/cabinet-design-2026-09-30');
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'');
html=html.replace('</head>','<style>'+fs.readFileSync(path.join(root,'cabinet-identity.css'),'utf8')+'</style></head>');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname==='/')return r.fulfill({contentType:'text/html',body:html});if(u.pathname.startsWith('/assets/'))return r.fulfill({path:path.join(root,u.pathname)});return r.abort();});
await page.goto('https://miniapp.test/');
await page.evaluate(()=>{state.dvPreview=false;api=async()=>({});renderDriverHome({driver:{name:'Alex Morgan',nickname:'Brooklyn Driver',avatar:'man-2',header_theme:'brass',car_model:'Toyota Sienna',car_year:'2025',car_trim:'XLE',car_number:'T000000C',weekly_price:'675',monthly_mileage_limit:'3500',payment_weekday:'5',deposit_contract:'1000',deposit_paid:'1000',deposit_balance:'0.00'},files:[],mileage:{}});showScreen('driver-home');renderMiles(2140,3500,{over:.25});document.getElementById('dv-pay-date').textContent='Пятница, 2 октября';});
await page.screenshot({path:path.join(out,'01-brass-mobile.png')});
await page.evaluate(()=>{document.querySelector('.pf-hero').dataset.theme='steel';document.getElementById('profile-theme').value='steel';document.getElementById('dv-customize').open=true;document.getElementById('screen-driver-home').scrollTop=0;});
await page.screenshot({path:path.join(out,'02-steel-settings-mobile.png')});
const checks=[];for(const width of [320,390,430]){await page.setViewportSize({width,height:844});checks.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,headerHeight:document.querySelector('#screen-driver-home>.logo-bar').getBoundingClientRect().height,brand:document.querySelector('.pf-identity-brand').textContent,plateHeight:document.querySelector('.pf-hero').getBoundingClientRect().height})));}
fs.writeFileSync(path.join(out,'layout-checks.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));await browser.close();})();
