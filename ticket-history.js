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
  function node(tag, cls, text) {
    const e = document.createElement(tag); if (cls) e.className=cls;
    if (text !== undefined) e.textContent=String(text); return e;
  }
  function money(cents, text) {
    return Number.isSafeInteger(cents) && cents >= 0 ? '$'+(cents/100).toFixed(2) : text.notKnown;
  }
  function stamp(value, text, lang) {
    const d = new Date(value); if (!value || isNaN(d)) return text.noNotice;
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
        field(text.amount,money(row.amount_cents,text));
        if(p.company_paid) field(text.companyAmount,money(p.company_paid_amount_cents,text));
        field(text.reimbursement,text[p.reimbursement_status]||text.notKnown);
        if(p.reimbursed_amount_cents!==null&&p.reimbursed_amount_cents!==undefined)
          field(text.reimbursed,money(p.reimbursed_amount_cents,text));
        if(p.reimbursement_balance_cents!==null&&p.reimbursement_balance_cents!==undefined)
          field(text.balance,money(p.reimbursement_balance_cents,text));
        field(text.notice,stamp(row.first_notification_at,text,lang));
        if(row.first_notification_at){
          const elapsed=Math.floor((Date.now()-new Date(row.first_notification_at).getTime())/86400000);
          if(Number.isFinite(elapsed)&&elapsed>=0)field(text.age,elapsed);
        }
        if(row.deadline_exclusive) field(text.deadline,stamp(row.deadline_exclusive,text,lang));
        else field(text.deadline,text.pending);
        card.append(fields);
        if(['review_pending','confirmed_submitted'].includes(row.dispute_status)) card.append(node('p','th-hold',text.dispute));
        const details=node('details','th-notifications'); details.append(node('summary','',text.notifications));
        for(const n of row.notifications||[])details.append(node('p','',
          stamp(n.at,text,lang)+' · '+n.channel+' · '+n.status+(n.simulated?' · TEST':'')));
        if(!(row.notifications||[]).length)details.append(node('p','',text.noNotice));
        card.append(details); list.append(card);
      }
    }
    async function load(){
      const mine=++generation; records=[]; filters.replaceChildren(); list.replaceChildren();
      status.textContent=text.loading; refresh.disabled=true;
      try {
        const data=await opts.load(); if(mine!==generation||!root.isConnected)return;
        if(!data||data.ok!==true||!Array.isArray(data.tickets))throw Error('invalid history');
        records=data.tickets; status.textContent=text.noTotals; render();
      } catch(_){if(mine===generation){status.textContent=text.error;list.replaceChildren();filters.replaceChildren();}}
      finally {if(mine===generation)refresh.disabled=false;}
    }
    refresh.onclick=load; load();
    return {reload:load, destroy(){generation++;root.replaceChildren();}};
  }
  global.TicketHistory={mount};
})(window);
