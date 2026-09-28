const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.match(/const SERVICE_REPORT_ISSUES = \{[\s\S]*?(?=function val\(id\))/)?.[0];
assert.ok(code,'service report UI function is present');

test('admin sees report ID, deficiencies, delivery and preserved versions',async()=>{
  const elements={
    'service-reports-driver':{textContent:''},
    'service-reports-list':{textContent:'',innerHTML:''},
  };
  const context={
    state:{currentDriver:{id:'123',name:'Beka',car_number:'ABC123'}},
    document:{getElementById:id=>elements[id]},
    showScreen:()=>{},
    esc:s=>String(s).replaceAll('<','&lt;'),
    vehicleTime:s=>s,
    encodeURIComponent,
    api:async path=>{
      assert.equal(path,'/workflow/records?uid=123&kind=report');
      return {records:[{id:'report-1',kind:'report',received_at:'2026-09-28T12:00:00Z',
        body:{category:'service',car:'ABC123',status:'needs_supplements',
          validation:{version:2,issues:['odometer_unverified']},
          history:[{version:1,photos:['receipt'],at:'2026-09-28T12:00:00Z'},
                   {version:2,photos:['odometer'],at:'2026-09-28T12:10:00Z'}]},
        notices:[{recipient:'driver',version:2,status:'delivered'}]}]};
    },
  };
  vm.createContext(context);
  vm.runInContext(code,context);
  await context.openServiceReports('123');
  const rendered=elements['service-reports-list'].innerHTML;
  for(const part of ['report-1','Нужны дополнения','Пробег не подтверждён','доставлен','Версия 1','Версия 2'])
    assert.ok(rendered.includes(part),part);
});
