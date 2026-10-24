/* Read-only history. api() must attach the host's verified session.
 * No tenant identity, role or financial decision is accepted from this UI.
 * Document text is rendered literally; original multi-tenant scans are withheld.
 */
(function (global) {
  'use strict';
  const labels = {
    ru: {title:'Мои тикеты', preview:'Тикеты арендатора', all:'Все', unpaid:'Неоплачено',
      paid_by_renter:'Оплачено арендатором', paid_by_company:'Оплачено компанией', unknown:'Не установлено',
      loading:'Загружаем историю…', error:'История недоступна. Это не означает, что тикетов нет.',
      empty:'В доступной истории тикетов нет.', filtered:'В этом разделе записей нет.', refresh:'Обновить',
      notice:'Первое уведомление', deadline:'Срок оплаты до', pending:'Срок требует проверки применимых условий',
      timezone:'Нью-Йорк', amount:'Сумма тикета', companyAmount:'Сумма оплаты компанией',
      reimbursement:'Возмещение компании', balance:'Подтверждённый остаток', notKnown:'Не установлено по фактам',
      not_reimbursed:'Не возмещено', partially_reimbursed:'Возмещено частично', reimbursed:'Возмещено',
      separate:'Оплата компанией не означает возмещение арендатором и сама по себе не списывает долг.',
      training:'ТЕСТ · реального обязательства нет', dispute:'Диспут: требование приостановлено на время проверки',
      notifications:'История уведомлений', noNotice:'Подтверждённой даты уведомления нет',
      age:'Полных дней с уведомления', noTotals:'Неустановленная оплата не считается неоплатой. Итоговый долг автоматически не рассчитывается.'},
    en: {title:'My tickets', preview:'Renter tickets', all:'All', unpaid:'Unpaid',
      paid_by_renter:'Paid by renter', paid_by_company:'Paid by company', unknown:'Not established',
      loading:'Loading history…', error:'History is unavailable. This does not mean there are no tickets.',
      empty:'No tickets in the available history.', filtered:'No records in this section.', refresh:'Refresh',
      notice:'First notification', deadline:'Payment deadline', pending:'Applicable payment terms need review',
      timezone:'New York', amount:'Ticket amount', companyAmount:'Amount paid by company',
      reimbursement:'Reimbursement to company', balance:'Verified outstanding amount', notKnown:'Not established by evidence',
      not_reimbursed:'Not reimbursed', partially_reimbursed:'Partially reimbursed', reimbursed:'Reimbursed',
      separate:'Company payment does not mean renter reimbursement and does not automatically discharge the obligation.',
      training:'TEST · no real obligation', dispute:'Dispute: demand paused during review',
      notifications:'Notification history', noNotice:'No confirmed notification date',
      age:'Complete days since notification', noTotals:'Unestablished payment is not classified as unpaid. A total debt is not inferred.'}
  };
  Object.assign(labels.ru,{ticketDate:'Дата тикета',overdue:'Просрочка',noOverdue:'Нет',paymentReview:'Оплата уточняется',
    blockNotice:'Уведомление о блокировке',blockDate:'Дата блокировки',blockRemaining:'До блокировки',
    notStarted:'Таймер не запущен',notRequired:'Не требуется: оплата подтверждена',
    blockDue:'Срок наступил',blockHold:'Применение блокировки приостановлено на время рассмотрения обращения.',
    blockReview:'Статус оплаты уточняется. Применение блокировки требует подтверждения неоплаты.',
    blockMeaning:'Блокировка запуска означает, что автомобиль не будет заводиться.',
    blockRule:'Срок — 14 суток после уведомления о блокировке, в том числе после 1 января.',
    days:'сут.',hours:'ч.',minutes:'мин.'});
  Object.assign(labels.en,{ticketDate:'Ticket date',overdue:'Overdue',noOverdue:'None',paymentReview:'Payment under review',
    blockNotice:'Blocking notification',blockDate:'Blocking date',blockRemaining:'Time until blocking',
    notStarted:'Countdown not started',notRequired:'Not required: payment confirmed',
    blockDue:'The scheduled time has arrived',blockHold:'Application of blocking is on hold during dispute review.',
    blockReview:'Payment is under review. Applying blocking requires confirmed nonpayment.',
    blockMeaning:'Start blocking means the vehicle will not start.',
    blockRule:'The period is 14 days after the blocking notification, including after January 1.',
    days:'d',hours:'h',minutes:'min'});
  function settled(row){const p=row.payment||{};return p.tenant_paid===true||p.debt_written_off===true||p.reimbursement_balance_cents===0;}
  function duration(ms,text){
    const mins=Math.max(0,Math.ceil(ms/60000)),days=Math.floor(mins/1440),hours=Math.floor(mins%1440/60);
    return days+' '+text.days+' '+hours+' '+text.hours+' '+(mins%60)+' '+text.minutes;
  }
  function overdue(row,text){
    if(settled(row))return text.noOverdue;
    const due=Date.parse(row.deadline_exclusive);
    if(!Number.isFinite(due))return text.pending;
    if(Date.now()<=due)return text.noOverdue;
    const p=row.payment||{};
    if(row.dispute_status==='review_pending'||row.dispute_status==='confirmed_submitted')return text.blockHold;
    if(!(p.categories||[]).includes('unpaid')&&!['not_reimbursed','partially_reimbursed'].includes(p.reimbursement_status))return text.paymentReview;
    return duration(Date.now()-due,text);
  }
  function node(tag, cls, text) {
    const e = document.createElement(tag); if (cls) e.className=cls;
    if (text !== undefined) e.textContent=String(text); return e;
  }
  function money(cents, text) {
    return Number.isSafeInteger(cents) && cents >= 0 ? '$'+(cents/100).toFixed(2) : text.notKnown;
  }
  function stamp(value, text, lang) {
    if(typeof value==='string'&&value.length===10&&value[4]==='-'&&value[7]==='-'){const d=new Date(value+'T12:00:00Z');if(isNaN(d))return text.notKnown;return d.toLocaleDateString(lang==='ru'?'ru-RU':'en-US',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'});}
    const d = new Date(value); if (!value || isNaN(d)) return text.notKnown;
    return d.toLocaleString(lang==='ru'?'ru-RU':'en-US', {timeZone:'America/New_York',
      year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+text.timezone;
  }
  function mount(root, opts) {
    let records=[], selected='all', generation=0;
    const lang=opts.language==='en'?'en':'ru', text=labels[lang];
    root.replaceChildren(); root.classList.add('ticket-history');
    const header=node('div','th-heading');
    header.append(node('h2','',opts.preview?text.preview:text.title));
    const refresh=node('button','th-refresh',text.refresh); refresh.type='button'; header.append(refresh); root.append(header);
    root.append(node('p','th-note',text.separate));
    const status=node('p','th-status'); status.setAttribute('role','status'); root.append(status);
    const filters=node('div','th-filters'); filters.setAttribute('aria-label',text.title); root.append(filters);
    const list=node('div','th-list'); root.append(list);
    function render() {
      filters.replaceChildren(); list.replaceChildren();
      for (const key of ['all','unpaid','paid_by_renter','paid_by_company','unknown']) {
        const count=records.filter(r=>key==='all'||(r.payment?.categories||[]).includes(key)).length;
        const b=node('button','th-filter',text[key]+' · '+count); b.type='button';
        b.dataset.filter=key; b.setAttribute('aria-pressed',String(key===selected));
        b.onclick=()=>{selected=key;render();}; filters.append(b);
      }
      const visible=records.filter(r=>selected==='all'||(r.payment?.categories||[]).includes(selected));
      if (!visible.length) list.append(node('p','th-status',records.length?text.filtered:text.empty));
      for (const row of visible) {
        const card=node('article','th-ticket'); card.dataset.ticketId=row.id;
        card.append(node('h3','','№ '+(row.ticket_number||'—')));
        card.append(node('p','th-plate',row.plate||'—'));
        if (row.training) card.append(node('p','th-test',text.training));
        const p=row.payment||{}, badges=node('div','th-badges');
        for(const key of p.categories||['unknown']) badges.append(node('span','th-badge th-'+key,text[key]||text.unknown));
        card.append(badges);
        const fields=node('dl','th-fields');
        function field(k,v){fields.append(node('dt','',k),node('dd','',v));}
        field(text.ticketDate,stamp(row.violation_at,text,lang));
        field(text.notice,row.first_notification_at?stamp(row.first_notification_at,text,lang):text.noNotice);
        field(text.amount,money(row.amount_cents,text));
        field(text.deadline,row.deadline_exclusive?stamp(row.deadline_exclusive,text,lang):text.pending);
        field(text.overdue,overdue(row,text));
        field(text.blockNotice,row.blocking_notice_at?stamp(row.blocking_notice_at,text,lang):text.notStarted);
        field(text.blockDate,settled(row)?text.notRequired:row.blocking_at?stamp(row.blocking_at,text,lang):text.notStarted);
        if(row.blocking_at&&!settled(row)){
          const timer=node('dd','th-blocking-countdown');timer.dataset.until=row.blocking_at;
          fields.append(node('dt','',text.blockRemaining),timer);
        }
        if(p.company_paid) field(text.companyAmount,money(p.company_paid_amount_cents,text));
        field(text.reimbursement,text[p.reimbursement_status]||text.notKnown);
        if(p.reimbursed_amount_cents!==null&&p.reimbursed_amount_cents!==undefined)
          field(text.reimbursed,money(p.reimbursed_amount_cents,text));
        if(p.reimbursement_balance_cents!==null&&p.reimbursement_balance_cents!==undefined)
          field(text.balance,money(p.reimbursement_balance_cents,text));
        card.append(fields);
        card.append(node('p','th-note',text.blockMeaning+' '+text.blockRule));
        if(row.blocking_status==='payment_review')card.append(node('p','th-note',text.blockReview));
        if(row.blocking_status==='dispute_hold')card.append(node('p','th-hold',text.blockHold));
        if(['review_pending','confirmed_submitted'].includes(row.dispute_status)) card.append(node('p','th-hold',text.dispute));
        const details=node('details','th-notifications'); details.append(node('summary','',text.notifications));
        for(const n of row.notifications||[])details.append(node('p','',
          stamp(n.at,text,lang)+' · '+n.channel+' · '+n.status+(n.simulated?' · TEST':'')));
        if(!(row.notifications||[]).length)details.append(node('p','',text.noNotice));
        card.append(details); list.append(card);
      }
    }
    function tick(){
      for(const timer of list.querySelectorAll('.th-blocking-countdown')){
        const remaining=Date.parse(timer.dataset.until)-Date.now();
        timer.textContent=Number.isFinite(remaining)?remaining<=0?text.blockDue:duration(remaining,text):text.notStarted;
      }
    }
    const ticker=setInterval(tick,1000);
    async function load(){
      const mine=++generation; records=[]; filters.replaceChildren(); list.replaceChildren();
      status.textContent=text.loading; refresh.disabled=true;
      try {
        const data=await opts.load(); if(mine!==generation||!root.isConnected)return;
        if(!data||data.ok!==true||!Array.isArray(data.tickets))throw Error('invalid history');
        records=data.tickets; status.textContent=text.noTotals; render();tick();
      } catch(_){if(mine===generation){status.textContent=text.error;list.replaceChildren();filters.replaceChildren();}}
      finally {if(mine===generation)refresh.disabled=false;}
    }
    refresh.onclick=load; load();
    return {reload:load, destroy(){generation++;clearInterval(ticker);root.replaceChildren();}};
  }
  global.TicketHistory={mount};
})(window);
