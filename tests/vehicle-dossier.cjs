const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(__dirname,'..');
const fixture = {
  plate:'DEMO11', models:['Toyota Sienna'], current_drivers:[{name:'Демо · Алексей'}],
  archived_cards:[{name:'Демо · Анна'}], assignment_status:'assigned', coverage_note:'Ранние периоды требуют сверки.',
  dossier:{
    identity:{models:['Toyota Sienna'],years:[2024],trims:['LE'],vins:['TEST0000000000001'],colors:['Серебристый']},
    can_add_event:true,
    summary:{rent_received_cents:65000,downtime_hours:0},
    sources:{crm:'available',events:'available',open_data_as_of:'2026-11-10',fleet_as_of:'2026-11-10'},
    mileage:{start:'2026-11-01',as_of:'2026-11-10',used_millimiles:2456000,complete_to_as_of:false},
    service:{baseline:{date:'2026-10-18',odometer_millimiles:60000000},as_of:'2026-11-10',remaining_millimiles:2544000},
    events:[
      {kind:'payment',at:'2026-11-10',title:'Оплата недели аренды',amount_cents:65000,amount_label:'Зачтено',source_ref:'Демо-квитанция 07'},
      {kind:'service',tags:['wheels'],at:'2026-11-08',title:'Замена масла и ротация шин',cost_cents:12500,amount_cents:12500,amount_label:'Расход',source_ref:'https://docs.google.com/spreadsheets/d/example/edit#gid=12&range=A2'},
      {kind:'rent',at:'2026-11-01',end_at:'2026-11-08',title:'Период аренды',tenant_name:'Демо · Алексей',source_ref:'Демо-договор 03'},
      {kind:'document',at:'2026-10-22',title:'Регистрация автомобиля',source_ref:'javascript:alert(1)',file_name:'demo-registration.pdf',document_id:'demo-doc',sha256:'demo-checksum'},
      {kind:'assignment',at:'2026-11-02T02:00:00Z',title:'Анна → Алексей',source_ref:'https://mail.google.com/mail/u/?authuser=demo%40example.test#all/abc123'},
      {kind:'accident',at:null,title:'Проверка <img src=x onerror=alert(1)>',source_ref:'Демо-акт 01'}
    ]
  }
};
const html=fs.readFileSync(path.join(app,'index.html'),'utf8').replace(/^init\(\);$/m,'');
async function run() {
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if (url.origin!=='https://miniapp.test') return route.abort();
      if (url.pathname==='/') return route.fulfill({contentType:'text/html',body:html});
      const name=path.basename(url.pathname);
      if (!['vehicle-dossier.css','vehicle-dossier.js','cabinet-identity.css'].includes(name)) return route.abort();
      return route.fulfill({path:path.join(app,name)});
    });
    await page.goto('https://miniapp.test/?lang=ru');
    await page.evaluate(f=>{
      window.record=f;window.requests=[];window.posts=[];window.failNext=false;
      api=async(p,o={})=>{
        requests.push(p);
        if (p==='/admin/vehicles') return {items:[record]};
        if (p==='/admin/vehicles/DEMO11/events' && o.method==='POST') {
          const data=JSON.parse(o.body);posts.push(data);
          if (failNext) {failNext=false;throw Error('Тест связи');}
          record.dossier.events.push({...data,id:'demo-1',amount_cents:data.cost_cents});
          return {id:'demo-1'};
        }
        if (p.startsWith('/admin/vehicles/DEMO11')) return record;
        throw Error('Unexpected route '+p);
      };
    },fixture);
    await page.evaluate(async()=>{state.isAdmin=false;await openVehicleHistory('DEMO11');await openVehicles()});
    assert.equal(await page.evaluate(()=>requests.length),0);
    await page.evaluate(async()=>{state.isAdmin=true;await openVehicles()});
    await page.getByRole('button',{name:/DEMO11/}).click();
    const scope=page.locator('#vehicle-history-body');
    await scope.getByRole('heading',{name:'Паспорт автомобиля'}).waitFor();
    assert.match(await scope.innerText(),/650,00/);
    assert.match(await scope.innerText(),/0 ч/);
    assert.match(await scope.innerText(),/содержит пропуски/);
    await scope.getByRole('button',{name:'Хронология',exact:true}).click();
    await scope.getByLabel('Показать').selectOption('drivers');
    assert.match(await scope.innerText(),/01 нояб\.|1 нояб\./);
    assert.match(await scope.innerText(),/Анна → Алексей/);
    assert.match(await scope.getByRole('link',{name:'Открыть письмо в Gmail'}).getAttribute('href'),/\/mail\/u\/\?authuser=demo%40example.test#all\/abc123$/);
    await scope.getByLabel('Показать').selectOption('service');
    assert.equal(await scope.locator('.vd-event').count(),1);
    assert.match(await scope.innerText(),/Замена масла/);
    const sheet=scope.getByRole('link',{name:'Открыть документ Google'});
    assert.match(await sheet.getAttribute('href'),/#gid=12&range=A2$/);
    assert.equal(await sheet.getAttribute('rel'),'noopener noreferrer');
    await scope.getByLabel('Показать').selectOption('expenses');
    assert.equal(await scope.locator('.vd-event').count(),1);
    await scope.getByLabel('Показать').selectOption('wheels');
    assert.equal(await scope.locator('.vd-event').count(),1);
    await scope.getByLabel('Показать').selectOption('accident');
    assert.equal(await scope.locator('img').count(),0);
    assert.match(await scope.innerText(),/Дата не указана/);
    await scope.getByRole('button',{name:'Документы',exact:true}).click();
    await scope.getByText(/Подтверждение · demo-registration/).click();
    assert.match(await scope.innerText(),/demo-checksum/);
    assert.equal(await scope.locator('a').count(),0);
    await scope.getByRole('button',{name:/Добавить событие/}).click();
    await scope.getByLabel('Тип события').selectOption('repair');
    await scope.getByLabel('Дата события (Нью-Йорк)',{exact:true}).fill('2026-11-11');
    await scope.getByLabel('Что произошло').fill('Демо-ремонт');
    await scope.getByLabel('Основание').fill('Тестовый акт 5');
    await scope.getByLabel('Расход').fill('19.05');
    await page.evaluate(()=>{window.failNext=true;});
    await scope.getByRole('button',{name:'Сохранить событие'}).click();
    await scope.getByText(/Не удалось получить квитанцию/).waitFor();
    assert.equal(await scope.getByLabel('Что произошло').inputValue(),'Демо-ремонт');
    await scope.getByRole('button',{name:'Сохранить событие'}).click();
    await scope.getByText('Событие сохранено в журнале машины.').waitFor();
    assert.match(await scope.innerText(),/Демо-ремонт/);
    const posts=await page.evaluate(()=>posts);
    assert.equal(posts.length,2);assert.deepEqual(posts[0],posts[1]);assert.equal(posts[0].cost_cents,1905);
    // A plate shared by two identities must never render unscoped details.
    await page.evaluate(async()=>{record.dossier.identity.vins.push('TEST0000000000002');await openVehicleHistory('DEMO11',true)});
    await scope.getByRole('button',{name:'TEST0000000000002'}).click();
    assert.equal(await page.evaluate(()=>requests.at(-1)),'/admin/vehicles/DEMO11?vin=TEST0000000000002');
    await scope.getByRole('button',{name:/Добавить событие/}).click();
    assert.equal(await scope.getByLabel('VIN по документу').inputValue(),'TEST0000000000002');
    assert.equal(await scope.getByLabel('VIN по документу').getAttribute('readonly'),'');
    // An earlier request resolving after navigation cannot repopulate private DOM.
    await page.evaluate(()=>{ window.savedApi=api;api=()=>new Promise(r=>window.releaseVehicle=r);window.outstanding=openVehicleHistory('DEMO11');showScreen('driver-home'); });
    await page.evaluate(async()=>{releaseVehicle(record);await outstanding;api=savedApi});
    assert.equal(await scope.innerText(),'');
    assert.equal(await page.locator('#screen-vehicles').textContent().then(t=>t.includes('Демо · Алексей')),false);
    await page.evaluate(async f=>{window.record=f;record.dossier.summary={};record.dossier.sources.crm='unavailable';record.dossier.events.push({kind:'downtime',at:'2026-07-27',end_at:'2026-08-17',title:'Простой',source_ref:'Демо-журнал'});await openVehicleHistory('DEMO11')},fixture);
    assert.match(await scope.innerText(),/Часть источников/);
    assert.match(await scope.innerText(),/Поступило по аренде \(банк\)\s+Нет данных/);
    assert.match(await scope.innerText(),/Простой по журналу\s+27 июл.*17 авг/);
    assert.match(await scope.innerText(),/точных часов нет/);
    await page.evaluate(async f=>{window.record=f;await openVehicleHistory('DEMO11')},fixture);
    await page.evaluate(()=>{document.getElementById('vehicle-screen-sub').textContent='Демонстрационный пример · вымышленные данные';});
    for (const width of [320,390,1024]) {
      await page.setViewportSize({width,height:844});
      assert(await scope.evaluate(node=>node.scrollWidth<=node.clientWidth),'No overflow at '+width);
      if (width===390 && process.env.VEHICLE_SCREENSHOT) {
        await page.screenshot({path:process.env.VEHICLE_SCREENSHOT});
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS vehicle dossier · admin isolation, filters, attachments, NY calendar, missing data, write retry and receipt, VIN disambiguation, stale response, 3 viewport widths.');
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
