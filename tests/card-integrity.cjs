const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try {
  for(const lang of ['ru','en']) {
   const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});
   await page.route('**/*',r=>new URL(r.request().url()).pathname==='/' ? r.fulfill({contentType:'text/html',body:html}) : r.abort());
   await page.goto('https://test.invalid/?lang='+lang);
   const result=await page.evaluate(async()=>{
    const read=()=>Object.fromEntries(['dv-over-cost','dv-over-miles','dv-miles-note','dv-pay-note','dv-pay-amount','dv-miles-limit'].map(id=>[id,document.getElementById(id).textContent]));
    const results={};
    renderMiles(4000,null,{unlimited:false});results.unknown=read();
    renderMiles(4000,null,{unlimited:true});results.unlimited=read();
    renderMiles(3390.52,2800,{});results.fraction=read();
    api=async()=>({});
    renderDriverHome({driver:{name:'Demo',tariff:'Эконом ($650/нед · 2800 миль/мес)'},mileage:{value:10,limit:'99999'}});
    results.sentinel=read();
    api=async()=>{const error=new Error('Conflict');error.status=409;throw error;};
    await loadMonthlyMileage('demo',2800,{},'');results.conflict=read();
    const NativeDate=Date;
    window.Date=class extends NativeDate { constructor(...args){super(...(args.length?args:['2026-10-01T01:00:00Z']));} };
    results.day=nextPaymentInfo('3');window.Date=NativeDate;
    return results;
   });
   assert.equal(result.unknown['dv-over-cost'],'—');
   assert.equal(result.unknown['dv-over-miles'],'—');
   assert.equal(result.unlimited['dv-over-cost'],'$0');
   assert.equal(result.fraction['dv-over-cost'],'$147.63');
   assert.match(result.fraction['dv-over-miles'],/590[.,]52/);
   assert.equal(result.sentinel['dv-over-cost'],'—');
   assert.equal(result.sentinel['dv-miles-limit'],'—');
   assert.equal(result.sentinel['dv-pay-amount'],'$650');
   assert.match(result.sentinel['dv-pay-note'],lang==='ru'?/названия тарифа/:/tariff label/);
   assert.equal(result.conflict['dv-over-cost'],'—');
   assert.match(result.conflict['dv-miles-note'],/GPS/);
   assert.equal(result.day.sub,lang==='ru'?'Сегодня':'Today');
   await page.close();
  }
  console.log('PASS: RU/EN unknown limit, unlimited, fractional miles, sentinel limit, tariff provenance, GPS conflict and New York schedule');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
