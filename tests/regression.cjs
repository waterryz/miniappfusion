const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/^init\(\);$/m,'');
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/New_York'});
 await context.route('**/*',r=>r.request().url()==='https://miniapp.test/'?r.fulfill({contentType:'text/html',body:html}):r.abort());
 async function check(name,fn,verify,screenshot){
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto('https://miniapp.test/');const data=await page.evaluate(fn);verify(data);assert.deepEqual(errors,[]);results.push({name,result:data});if(screenshot)await page.screenshot({path:path.join(__dirname,screenshot)});}
  finally{await page.close();}
 }
 try{
  await check('Vehicle history is read only and does not label notes as completed service',async()=>{
   const paths=[];
   api=async path=>{
    paths.push(path);
    if(path==='/admin/vehicles')return{items:[{plate:'T142367C',models:['Toyota Sienna'],current_drivers:[{name:'Current'}],assignment_status:'assigned'}]};
    if(path==='/admin/vehicles/T142367C')return{plate:'T142367C',models:['Toyota Sienna'],current_drivers:[{name:'Current'}],assignment_status:'assigned',coverage_note:'История неполная.',transfers:[{at:'2026-09-28T12:00:00Z',from_name:'Former',to_name:'Current'}],service_notes_available:true,service_notes:[{created_at:'2026-09-27T12:00:00Z',status:'done',text:'Check brakes'}]};
    throw Error('Unexpected route '+path);
   };
   await openVehicles();await openVehicleHistory('T142367C',true);
   const text=document.getElementById('vehicle-history-body').textContent;
   return{paths,hasTransfer:text.includes('Former → Current'),hasCaveat:text.includes('Закрытая заметка не подтверждает выполненное ТО'),hasPrivateMoney:text.includes('депозит')};
  },r=>{assert.deepEqual(r.paths,['/admin/vehicles','/admin/vehicles/T142367C']);assert.equal(r.hasTransfer,true);assert.equal(r.hasCaveat,true);assert.equal(r.hasPrivateMoney,false);});
  await check('Deposit keeps unknown, confirmed zero and excess separate from rent',()=>{
   const base={name:'Demo',car_number:'DEMO',weekly_price:'675'};
   renderDriverHome({driver:{...base},files:[],mileage:{}});
   const unknown={contract:document.getElementById('dv-deposit-contract').textContent,paid:document.getElementById('dv-deposit-paid').textContent,balance:document.getElementById('dv-deposit-balance').textContent,rent:document.getElementById('dv-pay-amount').textContent};
   renderDriverHome({driver:{...base,deposit_contract:'500.00',deposit_paid:'0.00',deposit_balance:'500.00'},files:[],mileage:{}});
   const zero={paid:document.getElementById('dv-deposit-paid').textContent,balance:document.getElementById('dv-deposit-balance').textContent};
   renderDriverHome({driver:{...base,deposit_contract:'500.00',deposit_paid:'650.00',deposit_balance:'-150.00'},files:[],mileage:{}});
   return{unknown,zero,excess:document.getElementById('dv-deposit-balance').textContent};
  },r=>{
   assert.deepEqual(r.unknown,{contract:'Не указано',paid:'Не подтверждено',balance:'Не рассчитана',rent:'$675'});
   assert.deepEqual(r.zero,{paid:'$0.00',balance:'$500.00'});
   assert.equal(r.excess,'Переплата $150.00');
  });
  await check('Admin changes only the confirmed deposit amount',async()=>{
   const driver={id:'101',name:'Demo',car_number:'DEMO',deposit_contract:'1000.00',deposit_paid:'425.00',deposit_balance:'575.00'};
   state.currentDriver=driver;let sent;
   api=async(p,o={})=>{if(p==='/api/fleet')return new Promise(()=>{});if(o.method==='PATCH'){sent=JSON.parse(o.body);return{};}return{driver,files:[]};};
   showEditDriver();document.getElementById('edit-deposit-paid').value='500';await submitEditDriver();
   return{sent,contract:document.getElementById('edit-deposit-contract').value};
  },r=>{assert.deepEqual(r.sent,{deposit_paid:'500'});assert.equal(r.contract,'1000.00');});
  await check('New cabinet preserves deposit fields and explains uncertain button delivery',async()=>{
   let sent;
   api=async(p,o={})=>{
    if(p==='/api/fleet')return new Promise(()=>{});
    if(p==='/drivers'&&o.method==='POST'){sent=JSON.parse(o.body);return{success:true,onboarding:{notification:'unknown'}};}
    if(p==='/drivers')return[];
    throw new Error('Unexpected route: '+p);
   };
   showAddDriver();
   for(const [id,value] of [['add-id','123'],['add-name','Demo'],['add-deposit-contract','1000'],['add-deposit-paid','0']])document.getElementById(id).value=value;
   await submitAddDriver();
   return{contract:sent.deposit_contract,paid:sent.deposit_paid,modal:document.getElementById('modal-text').textContent,open:document.getElementById('modal').classList.contains('open')};
  },r=>{assert.deepEqual(r,{contract:'1000',paid:'0',modal:'Доставка кнопки входа не подтверждена. Попросите водителя открыть бота и нажать /start. Повторно кабинет не создавайте.',open:true});});
  await check('Archive keeps the card and documents; restore uses dedicated actions',async()=>{
   const driver={id:'101',name:'Demo',car_number:'T100001C',version:1,archived:false};
   const files=[{name:'license',url:'https://example.invalid/license.jpg'}];
   const calls=[];
   api=async(p,o={})=>{
    calls.push([p,o.method||'GET']);
    if(p==='/driver/101/archive'){driver.archived=true;driver.version=2;return{success:true};}
    if(p==='/driver/101/restore'){driver.archived=false;driver.version=3;return{success:true};}
    if(p==='/drivers')return driver.archived?[]:[{...driver,file_count:1}];
    if(p==='/drivers?only_archived=1')return driver.archived?[{...driver,file_count:1}]:[];
    if(p==='/driver/101')return{driver:{...driver},files};
    throw new Error('Unexpected route: '+p);
   };
   state.currentDriver={...driver};state.currentFiles=files;
   renderProfile(state.currentDriver,files);confirmArchiveDriver();
   const archiveText=document.getElementById('modal-text').textContent;
   await archiveDriver();await openDriver('101');
   const archived={visible:!document.getElementById('restore-driver-btn').hidden,previewHidden:document.querySelector('[data-active-driver]').hidden,docs:state.currentFiles.length,listed:state.archivedDrivers.length};
   confirmRestoreDriver();await restoreDriver();
   return{archiveText,archived,active:state.drivers.length,calls};
  },r=>{
   assert.match(r.archiveText,/сохранятся/);
   assert.deepEqual(r.archived,{visible:true,previewHidden:true,docs:1,listed:1});
   assert.equal(r.active,1);
   assert.ok(r.calls.some(([p,m])=>p==='/driver/101/archive'&&m==='POST'));
   assert.ok(r.calls.some(([p,m])=>p==='/driver/101/restore'&&m==='POST'));
   assert.ok(r.calls.every(([,m])=>m!=='DELETE'));
  });
  await check('Document storage outage is shown as unavailable, not empty',()=>{
   renderDocs([],false);renderDvDocs([],false);
   return{admin:document.getElementById('photo-grid').textContent,tenant:document.getElementById('dv-doc-grid').textContent};
  },r=>{assert.match(r.admin,/временно недоступны/);assert.match(r.tenant,/временно недоступны/);assert.doesNotMatch(r.tenant,/Нет документов/);});
  await check('Pending GPS and unknown tariff are preserved; PATCH only changes price',async()=>{
   state.currentDriver={id:'101',name:'Demo',car_number:'DEMO',planet_gps_device_id:'GPS-OLD',tariff:'Стандарт',weekly_price:'650'};
   let sent;api=async(p,o={})=>{if(p==='/api/fleet')return new Promise(()=>{});if(o.method==='PATCH'){sent=JSON.parse(o.body);return{};}return{driver:state.currentDriver,files:[]};};
   showEditDriver();const gps=val('edit-gps'),tariff=val('edit-tariff');document.getElementById('edit-price').value='675';await submitEditDriver();return{gps,tariff,sent};
  },r=>{assert.equal(r.gps,'GPS-OLD');assert.equal(r.tariff,'Стандарт');assert.deepEqual(r.sent,{weekly_price:'675'});});
  await check('Missing GPS and malformed responses retain selection',async()=>{
   api=async()=>({d:'{"devices":[]}'});await loadFleetIntoSelect('edit-gps','OLD');const missing=val('edit-gps');
   api=async()=>({d:'broken'});await loadFleetIntoSelect('edit-gps','OLD');return{missing,malformed:val('edit-gps')};
  },r=>assert.deepEqual(r,{missing:'OLD',malformed:'OLD'}));
  await check('Explicit GPS clearing is submitted',async()=>{
   state.currentDriver={id:'101',name:'Demo',car_number:'DEMO',planet_gps_device_id:'OLD'};let sent;
   api=async(p,o={})=>{if(p==='/api/fleet')return{d:'{"devices":[]}'};if(o.method==='PATCH')sent=JSON.parse(o.body);return{driver:state.currentDriver,files:[]};};
   showEditDriver();await Promise.resolve();document.getElementById('edit-gps').value='';await submitEditDriver();return sent;
  },r=>assert.deepEqual(r,{planet_gps_device_id:''}));
  await check('Upload server error restores button and displays error',async()=>{
   state.currentDriver={id:'101'};state.selectedFile={name:'demo.png',size:10,type:'image/png'};document.getElementById('doc-name').value='Demo';
   window.FileReader=class{readAsDataURL(){queueMicrotask(()=>this.onload({target:{result:'data:image/png;base64,AA=='}}));}};
   api=async()=>{throw new Error('Test upload failure');};await submitUpload();return{disabled:document.getElementById('upload-btn').disabled,text:document.getElementById('toast').textContent};
  },r=>{assert.equal(r.disabled,false);assert.equal(r.text,'Test upload failure');});
  await check('File size and read errors are handled before upload',async()=>{
   const errors=[];try{await readDocumentFile({size:10*1024*1024+1,type:'image/png'});}catch(e){errors.push(e.message);}
   window.FileReader=class{readAsDataURL(){queueMicrotask(()=>this.onerror());}};
   try{await readDocumentFile({size:1,type:'image/png'});}catch(e){errors.push(e.message);}return errors;
  },r=>{assert.equal(r.length,2);assert.match(r[0],/10 МБ/);assert.match(r[1],/прочитать/);});
  await check('Old mileage and service responses cannot overwrite current car',async()=>{
   let a,b;api=p=>new Promise(r=>{if(p.endsWith('/A'))a=r;else b=r;});const pa=loadMonthlyMileage('A',2800,{},''),pb=loadMonthlyMileage('B',2800,{},'');b({mileage:222});await pb;a({mileage:111});await pa;
   const miles=document.getElementById('dv-miles-done').textContent;
   api=p=>new Promise(r=>{if(p.includes('/A?'))a=r;else b=r;});const sa=loadServiceMileage('A','2026-09-01'),sb=loadServiceMileage('B','2026-09-01');b({state:{miles_to_service:222}});await sb;a({state:{miles_to_service:111}});await sa;
   return{miles,service:document.getElementById('dv-svc-remain').textContent};
  },r=>assert.deepEqual(r,{miles:'222',service:'222'}));
  await check('Fleet service value is rendered and report keeps numeric zero',async()=>{
   state.drivers=[{id:'101',planet_gps_device_id:'GPS',last_service_mileage:'80000'}];renderFleet([{id:'GPS',name:'Demo',sn:'Demo',isStop:1}]);
   const service=document.querySelectorAll('#fleet-list .vc-metric-val')[2].textContent;
   document.getElementById('report-from').value='2026-09-01';document.getElementById('report-to').value='2026-09-20';api=async()=>({d:'{"reportList":[{"name":"Demo","mileage":0}]}'});await loadReport();return{service,zero:document.querySelector('#report-list .vc-badge').textContent};
  },r=>{assert.match(r.service,/80.?000 mi/);assert.equal(r.zero,'0.00');});
  await check('Expired login has a clear next step and no debug dump',async()=>{
   api=async()=>{throw Object.assign(new Error('Unauthorized'),{status:401});};await init();return{title:document.getElementById('i18n-wip-title').textContent,detail:document.getElementById('wip-debug').textContent};
  },r=>{assert.match(r.title,/через бота/);assert.equal(r.detail,'');});
  await check('Impossible dates rejected; leap day allowed',()=>({bad:Number.isNaN(_dateISO('2026-02-31')),good:_dateISO('2024-02-29') instanceof Date}),r=>assert.deepEqual(r,{bad:true,good:true}));
  await check('Owner notes private by default, escaped text, complete action',async()=>{
   const data={vehicle_key:'plate:DEMO',car_number:'DEMO · Toyota Sienna',is_admin:true,notes:[{id:'one',text:'При торможении слышен скрип. Проверить слева спереди.',author_role:'tenant',visibility:'shared',created_at:'2026-09-20T10:00:00Z',status:'open'}]};
   let sent;api=async(p,o={})=>{if(o.method==='POST'){sent=JSON.parse(o.body);data.notes.push({id:'two',text:sent.text,author_role:'owner',visibility:sent.visibility,created_at:'2026-09-20T10:01:00Z',status:'open'});}if(o.method==='PATCH')data.notes[0].status='done';return structuredClone(data);};
   showScreen('profile');await openServiceNotes('101');document.getElementById('notes-text').value='<img src=x onerror=alert(1)> Проверить давление.';noteTextChanged();await saveServiceNote();await completeServiceNote('one','done');
   return{visibility:sent.visibility,htmlImages:document.querySelectorAll('#notes-list img').length,done:document.querySelectorAll('#notes-done article').length,overflow:document.documentElement.scrollWidth>innerWidth};
  },r=>assert.deepEqual(r,{visibility:'internal',htmlImages:0,done:1,overflow:false}),'owner-notes.png');
  await check('Tenant note retry reuses id; draft survives close/reopen',async()=>{
   const data={vehicle_key:'plate:DEMO',car_number:'DEMO · Toyota Sienna',is_admin:false,notes:[]};let attempts=0;const ids=[];
   api=async(p,o={})=>{if(o.method==='POST'){const b=JSON.parse(o.body);ids.push(b.request_id);if(++attempts===1)throw new Error('network');data.notes=[{id:'one',text:b.text,author_role:'tenant',visibility:'shared',created_at:'2026-09-20T10:00:00Z',status:'open'}];}return structuredClone(data);};
   showScreen('driver-home');await openServiceNotes('me');document.getElementById('notes-text').value='На кочках стучит справа. Проверьте на следующем сервисе.';noteTextChanged();closeServiceNotes();await openServiceNotes('me');const draft=val('notes-text');await saveServiceNote();const afterError=val('notes-text');await saveServiceNote();
   return{draft,afterError,sameId:ids[0]===ids[1],cleared:val('notes-text'),visibilityHidden:document.getElementById('notes-visibility').style.display==='none',notes:document.querySelectorAll('#notes-list article').length,overflow:document.documentElement.scrollWidth>innerWidth};
  },r=>{assert.equal(r.draft,r.afterError);assert.ok(r.sameId);assert.equal(r.cleared,'');assert.ok(r.visibilityHidden);assert.equal(r.notes,1);assert.equal(r.overflow,false);},'tenant-notes.png');
  await check('Changed vehicle keeps draft and blocks retry on old assignment',async()=>{
   api=async(p,o={})=>{if(o.method==='POST')throw Object.assign(new Error('changed'),{status:409});return{vehicle_key:'plate:DEMO',car_number:'DEMO',is_admin:false,notes:[]};};
   await openServiceNotes('me');document.getElementById('notes-text').value='Check brakes';noteTextChanged();await saveServiceNote();return{text:val('notes-text'),disabled:document.getElementById('notes-save').disabled};
  },r=>assert.deepEqual(r,{text:'Check brakes',disabled:true}));
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.length,tests:results.map(r=>r.name)},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
