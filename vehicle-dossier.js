'use strict';

/* The existing Telegram admin session supplies authorization for every request. */
const VehicleDossier = (() => {
  const kinds = {
    assignment:'Передача', rent:'Период аренды', payment:'Поступление',
    accident:'ДТП', repair:'Ремонт', service:'ТО', wheels:'Шины',
    downtime:'Простой', document:'Документ', identity:'Паспорт', insurance:'Страхование',
    inspection:'Осмотр', odometer:'Одометр', ticket:'Тикет', note:'Заметка', other:'Другое'
  };
  const filters = {
    all:['Все события',Object.keys(kinds)], drivers:['Водители и передачи',['assignment']],
    finance:['Аренда и поступления',['rent','payment']], expenses:['Расходы по документам',[]], downtime:['Простой',['downtime']],
    accident:['ДТП',['accident']], service:['Ремонты, ТО и шины',['repair','service','wheels']],
    repairs:['Только ремонт',['repair']], maintenance:['Только ТО',['service']], wheels:['Шины и колёса',['wheels']],
    documents:['Паспорт, документы и осмотры',['identity','document','insurance','inspection']],
    odometer:['Пробег',['odometer']], ticket:['Тикеты',['ticket']], notes:['Заметки и другое',['note','other']]
  };
  const manualKinds = ['accident','repair','service','wheels','downtime','document','insurance','inspection','odometer','assignment','identity','note','other'];
  const missing = 'Нет данных';
  const currency = new Intl.NumberFormat('ru-RU',{style:'currency',currency:'USD',maximumFractionDigits:2});
  const number = new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3});
  const day = new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric'});
  const instant = new Intl.DateTimeFormat('ru-RU',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'});
  const nyDay = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/New_York'});
  const body = () => document.getElementById('vehicle-history-body');
  const available = request => state.isAdmin && request === state.navigationRequest;
  const money = cents => Number.isSafeInteger(cents) ? currency.format(cents/100) : missing;
  const miles = value => Number.isFinite(value) ? number.format(value/1000)+' mi' : missing;
  const joined = values => Array.isArray(values) ? values.filter(v=>v!=null && v!=='').join(' · ') : '';
  function passportField(record,key,field) {
    const identity=record.dossier?.identity||record.identity;
    const rows=identity?.[key]||record[key]||[];
    if (rows.length===1) return String(rows[0]);
    const passportRows=(record.dossier?.events||[]).filter(e=>e.kind==='identity' && (!e.plate||e.plate===record.plate));
    const values=[...new Set(passportRows.map(e=>e[field]).filter(Boolean))];
    return values.length===1?String(values[0]):'';
  }
  function vehicleLabel(record) {
    return joined([passportField(record,'models','model')||'Модель уточняется',
      passportField(record,'trims','trim'),passportField(record,'years','year')]);
  }
  function drivers(record) {
    const active=joined((record.current_drivers||[]).map(d=>d.name));
    const operator=record.designation==='operator'||(record.current_drivers?.length===1 && record.current_drivers[0].designation==='operator');
    if (active) return [(record.assignment_status==='ambiguous'?'Несколько назначений · ':operator?'Оператор · ':'Водитель · ')+active];
    const result=['Действующий водитель не указан'];
    const last=record.dossier?.last_assignment_record||record.last_assignment_record;
    if (last?.tenant_name) result.push('Последняя запись · '+last.tenant_name+(when(last.at)?' · '+when(last.at):''));
    const archived=joined((record.archived_cards||[]).map(d=>d.name));
    if (archived) result.push('Архив · '+archived);
    return result;
  }
  function when(value) {
    if (!value) return '';
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const time = new Date(dateOnly ? value+'T00:00:00Z' : value);
    if (!Number.isFinite(time.getTime())) return '';
    return dateOnly ? day.format(time) : instant.format(time)+' NY';
  }
  function el(tag,cls,text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text != null) item.textContent = text;
    return item;
  }
  function button(text,cls,action) {
    const item = el('button',cls,text);
    item.type='button';
    item.addEventListener('click',action);
    return item;
  }
  function card(title) {
    const box = el('section','vd-card');
    if (title) box.append(el('h3','',title));
    return box;
  }
  function fields(rows,cls='vd-fields') {
    const list = el('dl',cls);
    for (const [title,value] of rows) {
      const row = el('div');
      row.append(el('dt','',title),el('dd','',value ?? missing));
      list.append(row);
    }
    return list;
  }
  function sectionHeader(title,sub) {
    setText('vehicle-screen-title',title);
    setText('vehicle-screen-sub',sub);
  }
  function enter(title,sub,pending) {
    showScreen('vehicles');
    sectionHeader(title,sub);
    body().textContent=pending;
    body().scrollTop=0;
    return state.navigationRequest;
  }
  async function list() {
    if (!state.isAdmin) return;
    state.vehicleBack='drivers';
    const request=enter('Автомобили','Реестр парка','Загружаем автомобили…');
    try {
      const result=await api('/admin/vehicles');
      if (!available(request)) return;
      const rows=result.items || [];
      body().replaceChildren();
      for (const row of rows) {
        const item=button('','driver-card vd-list-item',()=>detail(row.plate,true));
        const info=el('span','d-info');
        info.append(el('span','vd-list-plate',row.plate),el('div','d-name',vehicleLabel(row)));
        for (const line of drivers(row)) info.append(el('div','vd-list-driver',line));
        item.append(info);
        body().append(item);
      }
      if (!rows.length) body().textContent='В доступном реестре машины не найдены.';
    } catch (error) {
      if (available(request)) body().textContent='Не удалось загрузить автомобили. '+error.message;
    }
  }
  function oldEvents(record) {
    return [
      ...(record.transfers||[]).map(t=>({kind:'assignment',at:t.at,title:(t.from_name||'Прежний водитель не указан')+' → '+(t.to_name||'Новый водитель не указан'),source_ref:t.id})),
      ...(record.service_notes||[]).map(n=>({kind:'note',at:n.created_at,title:n.status==='done'?'Закрытая сервисная заметка':'Сервисная заметка',description:n.text,source_ref:n.id}))
    ];
  }
  function sourceLink(ref) {
    let url;
    try { url=new URL(ref); } catch { return null; }
    if (url.protocol!=='https:'||url.username||url.password||url.port) return null;
    let label;
    if (url.hostname==='docs.google.com' && /^\/(spreadsheets|document)\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)) label='Открыть документ Google';
    if (url.hostname==='drive.google.com' && (/^\/file\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname) ||
        (url.pathname==='/open' && /^[A-Za-z0-9_-]+$/.test(url.searchParams.get('id')||'')))) label='Открыть файл в Google Drive';
    const gmailFolder=/^\/mail\/(?:u\/\d+\/?)?$/.test(url.pathname) ||
      (url.pathname==='/mail/u/' && url.searchParams.has('authuser'));
    if (url.hostname==='mail.google.com' && gmailFolder && /^#(?:all|inbox|sent|label\/[^/]+)\/[a-zA-Z0-9_-]+$/.test(url.hash)) label='Открыть письмо в Gmail';
    if (!label) return null;
    const link=el('a','vd-link',label);
    link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
    return link;
  }
  function eventRow(e) {
    const row=el('article','vd-event');
    const dates=[when(e.at) || 'Дата не указана'];
    if (e.end_at) dates.push((e.kind==='rent'?'до ':'')+(when(e.end_at)||'дата уточняется')+(e.kind==='rent'?' (исключительно)':''));
    row.append(el('div','vd-event-meta',dates.join(' — ')+' · '+(kinds[e.kind]||'Событие')),
      el('h4','',e.title||kinds[e.kind]||'Событие'));
    if (!when(e.at) && when(e.observed_at)) row.append(el('p','vd-caption','Дата записи в источнике · '+when(e.observed_at)));
    if (e.tenant_name) row.append(el('p','',e.tenant_name));
    if (e.description) row.append(el('p','',e.description));
    if (e.status) row.append(el('p','vd-caption','Статус · '+statusLabel(e.status)));
    if (Number.isSafeInteger(e.amount_cents)) row.append(el('p','',(e.amount_label||'Сумма')+' · '+money(e.amount_cents)));
    if (e.odometer_status==='excluded') row.append(el('p','vd-warning','Показание исключено при сверке.'));
    else if (Number.isFinite(e.odometer_miles)) row.append(el('p','',
      (e.odometer_status==='estimate'?'Оценочный пробег':e.odometer_status==='verified'?'Сверенный одометр':'Одометр')+' · '+number.format(e.odometer_miles)+' mi'));
    if (e.vin) row.append(el('p','','VIN · '+e.vin));
    if (e.plate) row.append(el('p','vd-caption','Номер в записи · '+e.plate+
      (e.vehicle_basis==='plate'?' · связь по номеру':e.vehicle_basis==='vin'?' · связь по VIN':'')));
    if (e.kind==='ticket') row.append(fields([
      ['Сумма CityPay',money(e.citypay_cents)],['CityPay на',when(e.citypay_as_of)||missing],
      ['Сумма в городском API',money(e.api_due_cents)],['Городской API на',when(e.api_as_of)||missing],
      ['Остаток арендатора',money(e.tenant_balance_cents)],['Оплата городу компанией',paidFact(e.company_paid)],
      ['Оплата городу арендатором',paidFact(e.tenant_city_paid)]
    ]));
    if (e.kind==='rent' && e.balance_cents!=null) row.append(el('p','','Остаток · '+money(e.balance_cents)));
    if (e.source_ref || e.document_id || e.file_name || e.source_id) {
      const evidence=el('details');
      evidence.append(el('summary','',e.file_name?'Подтверждение · '+e.file_name:'Основание записи'));
      if (e.source_ref) evidence.append(el('p','vd-source',e.source_ref));
      if (e.source_id) evidence.append(el('p','vd-source','Код источника · '+e.source_id));
      if (e.document_id) evidence.append(el('p','vd-source','Документ · '+e.document_id));
      if (e.sha256) evidence.append(el('p','vd-source','SHA-256 · '+e.sha256));
      if (when(e.observed_at)) evidence.append(el('p','vd-source','Записано источником · '+when(e.observed_at)));
      row.append(evidence);
      const refs=new Set([e.source_ref,e.receipt_source,e.tenant_basis,e.api_source,e.citypay_source,e.card_source_ref].filter(Boolean));
      for (const ref of refs) {
        const link=sourceLink(ref);
        if (link) row.append(link);
        else if (ref!==e.source_ref) evidence.append(el('p','vd-source',ref));
      }
    }
    return row;
  }
  function paidFact(value) {
    return value===true?'Оплачено':value===false?'Оплата не записана':missing;
  }
  function statusLabel(status) {
    return ({paid:'Оплачено',open:'Открыто',closed:'Закрыто',done:'Закрыто',partial:'Частично',
      due:'К оплате',upcoming:'Предстоит',overdue:'Просрочено',scheduled:'Запланировано',pending:'В обработке',
      accepted:'Принято',available:'Доступно',stale:'Предыдущие данные',unknown:'Уточняется',
      posted:'Проведено банком',ready:'Расчёт доступен',ok:'В норме'})[status]||status;
  }
  function sourceNotes(record,dossier) {
    const section=card('Источники и дата данных');
    if (record.coverage_note) section.append(el('p','vd-caption',record.coverage_note));
    const sources=dossier?.sources||{};
    const rows=[['CRM',sources.crm==='available'?'Доступна':'Данные не получены'],
      ['Журнал автомобиля',sources.events==='available'?'Доступен':'Данные не получены'],
      ['Городской API',when(sources.open_data_as_of)||'Дата не получена'],
      ['CityPay',when(sources.citypay_as_of)||'Дата не получена'],
      ['GPS',when(sources.fleet_as_of)||'Дата не получена']];
    if (record.current_assignments_as_of) rows.unshift(['Назначение водителя сверено',when(record.current_assignments_as_of)||record.current_assignments_as_of]);
    section.append(fields(rows));
    return section;
  }
  function overview(view) {
    const {record,dossier}=view;
    const identity=dossier?.identity||{};
    const passport=card('Паспорт автомобиля');
    passport.append(fields([
      ['Номер',record.plate],['Модель',passportField(record,'models','model')||missing],
      ['Год',passportField(record,'years','year')||missing],['Комплектация',passportField(record,'trims','trim')||missing],
      ['Цвет',joined(identity.colors)||missing],['VIN',identity.selected_vin||record.vin||joined(identity.vins)||missing],
      ['Номер TLC',joined(identity.tlc_numbers)||missing]
    ]));
    if (identity.linked_plates?.length>1) {
      passport.append(el('p','vd-caption','История по связанным с VIN номерам'));
      for (const plate of identity.linked_plates) passport.append(button(plate,'vd-secondary',()=>detail(plate,true)));
    }
    const payments=card('Аренда и расходы');
    const totals=dossier?.summary||{};
    const downtime=view.events.find(e=>e.kind==='downtime' && e.at && e.end_at);
    payments.append(fields([['Поступило по аренде (банк)',money(totals.rent_received_cents)],
      ['Простой по журналу',Number.isFinite(totals.downtime_hours)?number.format(totals.downtime_hours)+' ч':
        downtime?when(downtime.at)+' — '+when(downtime.end_at):missing]],'vd-grid'));
    if (downtime && !Number.isFinite(totals.downtime_hours)) payments.append(el('p','vd-caption','Последний записанный период простоя. В источнике указаны даты, точных часов нет.'));
    payments.append(el('p','vd-caption','Начисления, поступления и расходы показаны по отдельным событиям.'),
      button('Аренда и поступления','vd-secondary',()=>view.go('history','finance')),
      document.createTextNode(' '),button('Расходы','vd-secondary',()=>view.go('history','expenses')),
      document.createTextNode(' '),button('Периоды простоя','vd-secondary',()=>view.go('history','downtime')));
    const maintenance=card('Пробег и обслуживание');
    const m=dossier?.mileage||{}, s=dossier?.service||{};
    maintenance.append(fields([
      ['Пробег за период GPS',miles(m.used_millimiles)],['Начало периода',when(m.start)||missing],['Конец периода',when(m.period_end)||missing],
      ['Данные пробега на',when(m.as_of)||missing],['Дата базового ТО',when(s.baseline?.date)||missing],
      ['Одометр при ТО',miles(s.baseline?.odometer_millimiles)],['После ТО',miles(s.since_service_millimiles)],
      ['До следующего ТО',miles(s.remaining_millimiles)],['Сверх интервала',miles(s.overdue_millimiles)],
      ['Расчёт ТО на',when(s.as_of)||missing]
    ]));
    if (m.stale||m.complete_to_as_of===false||s.stale||s.data_issue) maintenance.append(el('p','vd-warning','GPS или расчёт ТО содержит пропуски. Сверьте даты показаний.'));
    maintenance.append(button('Записи об обслуживании','vd-secondary',()=>view.go('history','service')));
    const drivers=card('Водители и передачи');
    drivers.append(fields([['Текущие водители',joined((record.current_drivers||[]).map(d=>d.name))||'Назначение не указано'],
      ['Архивные карточки',joined((record.archived_cards||[]).map(d=>d.name))||'В реестре нет записей']]),
      button('Хронология передач','vd-secondary',()=>view.go('history','drivers')));
    const recent=card('Последние события');
    for (const item of view.events.slice(0,2)) recent.append(eventRow(item));
    if (!view.events.length) recent.append(el('p','vd-empty','В полученных источниках записей нет.'));
    recent.append(button('Вся хронология','vd-secondary',()=>view.go('history','all')));
    view.panel.append(passport,recent,payments,maintenance,drivers,sourceNotes(record,dossier));
  }
  function eventPage(view,documents=false) {
    const box=card(documents?'Документы автомобиля':'Хронология');
    if (documents) box.append(el('p','vd-caption','Регистрация, полисы и осмотры из источников, связанных с этой машиной.'));
    else {
      const bar=el('div','vd-tools'), label=el('label'), filter=el('select');
      label.append(el('span','vd-label','Показать'),filter);
      for (const [key,[name]] of Object.entries(filters)) filter.add(new Option(name,key));
      filter.value=view.filter;
      filter.addEventListener('change',()=>{view.filter=filter.value;view.limit=25;renderRows();});
      bar.append(label);
      box.append(bar);
    }
    const rows=el('div'), more=button('Показать ещё','vd-secondary',()=>{view.limit+=25;renderRows();});
    function renderRows() {
      const key=documents?'documents':view.filter;
      const events=view.events.filter(e=>key==='all'||(key==='expenses' && Number.isSafeInteger(e.cost_cents))||
        [e.kind,...(e.tags||[])].some(kind=>filters[key][1].includes(kind)));
      rows.replaceChildren(...events.slice(0,view.limit).map(eventRow));
      if (!events.length) rows.append(el('p','vd-empty',documents?'Связанных документов в полученных источниках нет.':'В полученных источниках таких записей нет.'));
      more.hidden=events.length<=view.limit;
    }
    renderRows();
    box.append(rows,more);
    view.panel.append(box);
    if (!documents && (view.filter==='notes'||view.filter==='all')) view.panel.append(el('p','vd-caption','Закрытая заметка не подтверждает выполненное ТО.'));
  }
  function eventForm(view) {
    const box=card('Добавить событие'), form=el('form','vd-form');
    const input=(name,label,type,required=false)=>{
      const wrap=el('label'), field=el(type==='select'?'select':type==='textarea'?'textarea':'input');
      if (field.tagName==='INPUT') field.type=type;
      field.name=name;
      field.required=required;
      wrap.append(el('span','vd-label',label),field);
      form.append(wrap);
      return field;
    };
    const kind=input('kind','Тип события','select',true);
    for (const key of manualKinds) kind.add(new Option(kinds[key],key));
    const at=input('at','Дата события (Нью-Йорк)','date');
    const observed=input('observed_at','Дата записи в источнике, если дата события неизвестна','date');
    const end=input('end_at','Дата окончания, если известна','date');
    const exactStart=input('exact_start','Точное начало со смещением UTC','text');
    const exactEnd=input('exact_end','Точное окончание со смещением UTC','text');
    for (const field of [exactStart,exactEnd]) field.placeholder='2026-11-01T09:30:00-05:00';
    const title=input('title','Что произошло','text',true);
    const source=input('source_ref','Основание (например, номер акта)','text',true);
    const desc=input('description','Подробности','textarea');
    const cost=input('cost','Расход по документу, USD','number');
    const odo=input('odometer_miles','Показание одометра, mi','number');
    const vin=input('vin','VIN по документу','text');
    if (view.vin) { vin.value=view.vin; vin.readOnly=true; }
    else if (view.record.vin) vin.value=view.record.vin;
    const model=input('model','Модель','text'), year=input('year','Год выпуска','text'), trim=input('trim','Комплектация','text');
    const color=input('color','Цвет','text'), tlc=input('tlc_number','Номер TLC','text');
    const identityFields=[model,year,trim,color,tlc];
    title.maxLength=200; source.maxLength=1000; desc.maxLength=3000;
    model.maxLength=120; year.pattern='(19|20)[0-9]{2}'; trim.maxLength=60; color.maxLength=50; tlc.maxLength=80;
    cost.min='0'; cost.step='0.01'; odo.min='0'; odo.step='0.001'; vin.maxLength=17;vin.pattern='[A-HJ-NPR-Za-hj-npr-z0-9]{17}';
    function updateFields() {
      for (const field of [exactStart,exactEnd]) { field.disabled=kind.value!=='downtime'; field.parentElement.hidden=field.disabled; }
      for (const field of identityFields) { field.disabled=kind.value!=='identity'; field.parentElement.hidden=field.disabled; }
    }
    kind.addEventListener('change',updateFields);updateFields();
    const controls=el('div','vd-tools'), submit=el('button','vd-primary','Сохранить событие');
    submit.type='submit';
    const cancel=button('Отмена','vd-secondary',()=>view.go('history','all'));
    const message=el('p','vd-caption'); message.setAttribute('role','status');
    controls.append(submit,cancel);
    form.append(controls,message);
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if (submit.disabled||!available(view.request)) return;
      const payload={kind:kind.value,at:at.value||null,title:title.value.trim(),source_ref:source.value.trim()};
      if (!payload.title||!payload.source_ref) { message.textContent='Укажите событие и его основание.'; return; }
      if (kind.value==='downtime' && (exactStart.value||exactEnd.value)) {
        const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/;
        if (!iso.test(exactStart.value)||!iso.test(exactEnd.value)||!(Date.parse(exactEnd.value)>Date.parse(exactStart.value))) {
          message.textContent='Для точного простоя укажите начало и окончание со смещением UTC. Окончание должно быть позже начала.';return;
        }
        payload.at=exactStart.value;payload.end_at=exactEnd.value;
      } else {
        if (!payload.at && !observed.value) { message.textContent='Укажите дату события или дату записи в источнике.'; return; }
        if (!payload.at && end.value) { message.textContent='Для интервала требуется дата начала.'; return; }
        if (end.value && end.value<=payload.at) { message.textContent='Дата окончания должна быть позже даты события.'; return; }
        if (end.value) payload.end_at=end.value;
      }
      if (observed.value) payload.observed_at=observed.value;
      if (desc.value.trim()) payload.description=desc.value.trim();
      if (cost.value!=='') payload.cost_cents=Math.round(Number(cost.value)*100);
      if (odo.value!=='') payload.odometer_miles=Number(odo.value);
      if (vin.value.trim()) payload.vin=vin.value.trim().toUpperCase();
      for (const field of identityFields) if (!field.disabled && field.value.trim()) payload[field.name]=field.value.trim();
      submit.disabled=true;
      message.textContent='Сохраняем…';
      try {
        await api(view.path+'/events',{method:'POST',body:JSON.stringify(payload)});
      } catch (error) {
        if (available(view.request)) {
          const messageByCode={
            vehicle_event_source_conflict:'По этому основанию уже есть другая запись. Сверьте её в хронологии.',
            vehicle_history_writes_disabled:'Сейчас журнал доступен только для чтения.',
            vehicle_event_in_future:'Проверьте дату. История принимает фактически произошедшие события.'
          };
          message.textContent=messageByCode[error.message]||'Не удалось получить квитанцию. '+error.message;
          submit.disabled=false;
        }
        return;
      }
      if (!available(view.request)) return;
      await detail(view.record.plate,state.vehicleBack==='list','history','Событие сохранено в журнале машины.',view.vin);
    });
    box.append(form);view.panel.append(box);
  }
  function render(record,path,request,tab,notice,vin) {
    const dossier=record.dossier;
    const vins=dossier?.identity?.vins||[];
    if (vins.length>1 && !vin) {
      const choose=card('Выберите автомобиль по VIN');
      choose.append(el('p','vd-caption','Этот номер встречается в паспортах нескольких машин. Выберите VIN, чтобы открыть историю нужного автомобиля.'));
      for (const identifier of vins) choose.append(button(identifier,'vd-secondary',()=>detail(record.plate,state.vehicleBack==='list','overview','',identifier)));
      body().replaceChildren(choose);
      return;
    }
    const events=(dossier?.events||oldEvents(record)).slice();
    // Compare the New York day for mixed exact timestamps and calendar dates.
    const dateKey=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:
      value && Number.isFinite(Date.parse(value))?nyDay.format(new Date(value)):'';
    const order=value=>value?.length>10?Date.parse(value):0;
    events.sort((a,b)=>dateKey(b.at).localeCompare(dateKey(a.at))||
      order(b.at)-order(a.at)||String(b.id||'').localeCompare(String(a.id||'')));
    const view={record,path,dossier,events,request,vin,filter:'all',limit:25,panel:el('div')};
    const hero=card();
    hero.classList.add('vd-hero');
    hero.append(el('span','vd-plate',record.plate),
      el('h2','',vehicleLabel(record)));
    for (const line of drivers(record)) hero.append(el('div','vd-driver',line));
    if (vin) hero.append(el('p','vd-caption','Показаны только записи, связанные с выбранным VIN.'));
    else if (record.assignment_status==='ambiguous') hero.append(el('p','vd-warning','Номер указан у нескольких действующих водителей. Требуется сверка.'));
    if (!dossier || dossier.sources?.crm!=='available' || dossier.sources?.events!=='available') {
      hero.append(el('p','vd-warning',!dossier?'Доступны прежние передачи и сервисные заметки. Расширенные источники ещё не получены.':
        'Часть источников сейчас недоступна. Показаны полученные записи.'));
    }
    const nav=el('nav','vd-nav');nav.setAttribute('aria-label','Разделы карточки машины');
    const tabs=[['overview','Обзор'],['history','Хронология'],['documents','Документы']];
    const tabButtons=new Map();
    function go(key,filter) {
      view.filter=filter||'all';view.limit=25;
      view.panel.replaceChildren();
      for (const [name,btn] of tabButtons) btn.setAttribute('aria-pressed',name===key?'true':'false');
      if (key==='new') eventForm(view);
      else if (key==='overview') overview(view);
      else eventPage(view,key==='documents');
      body().scrollTop=0;
    }
    view.go=go;
    for (const [key,label] of tabs) {
      const btn=button(label,'',()=>go(key));tabButtons.set(key,btn);nav.append(btn);
    }
    body().replaceChildren(hero,nav);
    if (notice) { const confirmation=el('p','vd-card',notice); confirmation.setAttribute('role','status'); body().append(confirmation); }
    if (dossier?.sources?.events==='available' && dossier.can_add_event===true) {
      const tools=el('div','vd-tools');tools.append(button('＋ Добавить событие','vd-primary',()=>go('new')));body().append(tools);
    }
    body().append(view.panel);
    go(tab);
    if (!dossier) go('history');
  }
  async function detail(plate,fromList=false,tab='overview',notice='',vin='') {
    if (!state.isAdmin) return;
    if (!plate) { toast('У водителя не указан номер машины.','error'); return; }
    state.vehicleBack=fromList?'list':'profile';
    const request=enter('Карточка автомобиля',vin?plate+' · '+vin:plate,'Загружаем карточку…');
    const path='/admin/vehicles/'+encodeURIComponent(plate);
    try {
      const record=await api(path+(vin?'?vin='+encodeURIComponent(vin):''));
      if (available(request)) render(record,path,request,tab,notice,vin);
    } catch (error) {
      if (available(request)) {
        body().replaceChildren(el('p','vd-empty',(notice?notice+' ':'')+'Не удалось загрузить карточку. '+error.message),
          button('Повторить загрузку','vd-secondary',()=>detail(plate,fromList,tab,notice,vin)));
      }
    }
  }
  return {list,detail};
})();

function openVehicles() { return VehicleDossier.list(); }
function openVehicleHistory(plate,fromList=false) { return VehicleDossier.detail(plate,fromList); }
function closeVehicleHistory() {
  if (state.vehicleBack==='profile') showScreen('profile');
  else if (state.vehicleBack==='list') openVehicles();
  else showScreen('drivers');
}
