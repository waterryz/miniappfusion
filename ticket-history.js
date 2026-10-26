/* History and scoped dispute requests use the host's verified session.
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
  labels.ka={title:'ჩემი ჯარიმები',preview:'მოიჯარის ჯარიმები',all:'ყველა',unpaid:'გადაუხდელი',paid_by_renter:'მოიჯარის მიერ გადახდილი',paid_by_company:'კომპანიის მიერ გადახდილი',unknown:'დაუდგენელი',loading:'ისტორია იტვირთება…',error:'ისტორია მიუწვდომელია. ეს არ ნიშნავს, რომ ჯარიმები არ არის.',empty:'ხელმისაწვდომ ისტორიაში ჯარიმები არ არის.',filtered:'ამ განყოფილებაში ჩანაწერები არ არის.',refresh:'განახლება',notice:'პირველი შეტყობინება',deadline:'გადახდის ვადა',pending:'გადახდის ვადა დასაზუსტებელია',timezone:'ნიუ-იორკი',amount:'ჯარიმის თანხა',companyAmount:'კომპანიის მიერ გადახდილი თანხა',reimbursement:'კომპანიისთვის ანაზღაურება',balance:'დადასტურებული ნაშთი',notKnown:'ფაქტებით არ დგინდება',not_reimbursed:'არ არის ანაზღაურებული',partially_reimbursed:'ნაწილობრივ ანაზღაურებული',reimbursed:'ანაზღაურებული',separate:'კომპანიის მიერ გადახდა მოიჯარის მიერ ანაზღაურებას არ ნიშნავს და ვალს ავტომატურად არ ხურავს.',training:'ტესტი · რეალური ვალდებულების გარეშე',dispute:'დავა: მოთხოვნა განხილვის პერიოდში შეჩერებულია',notifications:'შეტყობინებების ისტორია',noNotice:'შეტყობინების დადასტურებული თარიღი არ არის',age:'შეტყობინებიდან სრული დღეები',noTotals:'დაუდგენელი გადახდა გადაუხდელობად არ ითვლება. საერთო ვალი ვარაუდით არ გამოითვლება.',ticketDate:'ჯარიმის თარიღი',overdue:'ვადაგადაცილება',noOverdue:'არ არის',paymentReview:'გადახდა მოწმდება',blockNotice:'ბლოკირების შეტყობინება',blockDate:'ბლოკირების თარიღი',blockRemaining:'ბლოკირებამდე დარჩენილი დრო',notStarted:'ტაიმერი არ დაწყებულა',notRequired:'არ არის საჭირო: გადახდა დადასტურებულია',blockDue:'დაგეგმილი დრო დადგა',blockHold:'ბლოკირება დავის განხილვის პერიოდში შეჩერებულია.',blockReview:'გადახდა მოწმდება. ბლოკირებას გადაუხდელობის დადასტურება სჭირდება.',blockMeaning:'დაქოქვის ბლოკირება ნიშნავს, რომ ავტომობილი ვერ დაიქოქება.',blockRule:'ვადა ბლოკირების შეტყობინებიდან 14 დღეა, მათ შორის 1 იანვრის შემდეგაც.',days:'დღ.',hours:'სთ.',minutes:'წთ.'};
  Object.assign(labels.ru,{disputeTitle:'Диспут',reason:'Причина диспута',holdUntil:'Отсрочка до',remainingAfter:'После отсрочки останется',disputeStarted:'Диспут открыт',resume:'Отсрочка завершена. Продолжается оставшееся время прежнего таймера.',pauseRule:'Отсрочка — 14 суток. Затем продолжится оставшееся время прежнего таймера. Повторная отправка не продлевает отсрочку. Обращение в компанию не является подачей диспута в городской орган.',notify:'Получать уведомления об этом диспуте в Telegram',notifyOwner:'Согласие арендатора на уведомления об этом диспуте в Telegram подтверждено',submitDispute:'Отправить диспут',disputeError:'Не удалось сохранить диспут. Обновите карточку и проверьте статус тикета.',paused:'Таймер на паузе',cabinet:'Кабинет',telegram:'Telegram',openedNotice:'Диспут зарегистрирован',resumedNotice:'Отсрочка завершена',payTicket:'Оплатить компании',needsReview:'Перед оплатой нужно подтвердить остаток по этому тикету.'});
  Object.assign(labels.en,{disputeTitle:'Dispute',reason:'Dispute reason',holdUntil:'Pause until',remainingAfter:'Time left after the pause',disputeStarted:'Dispute opened',resume:'The pause has ended. The original remaining countdown has resumed.',pauseRule:'The pause lasts 14 days. The original time left then resumes. Submitting again does not extend the pause. A request to the company is not a dispute filing with the city.',notify:'Receive updates about this dispute in Telegram',notifyOwner:'Renter consent for Telegram updates about this dispute is confirmed',submitDispute:'Submit dispute',disputeError:'The dispute could not be saved. Refresh the card and check the ticket status.',paused:'Countdown paused',cabinet:'Account',telegram:'Telegram',openedNotice:'Dispute recorded',resumedNotice:'Pause ended',payTicket:'Pay the company',needsReview:'The outstanding amount must be confirmed before payment.'});
  Object.assign(labels.ka,{disputeTitle:'დავა',reason:'დავის მიზეზი',holdUntil:'გადავადება სრულდება',remainingAfter:'გადავადების შემდეგ დარჩება',disputeStarted:'დავა დაიწყო',resume:'გადავადება დასრულდა. გაგრძელდა წინა ტაიმერზე დარჩენილი დროის ათვლა.',pauseRule:'გადავადება გრძელდება 14 დღე. შემდეგ გაგრძელდება წინა ტაიმერზე დარჩენილი დრო. ხელახალი გაგზავნა გადავადებას არ აგრძელებს. კომპანიისთვის მიმართვა ქალაქის უწყებაში დავის შეტანას არ ნიშნავს.',notify:'ამ დავის შესახებ შეტყობინებების მიღება Telegram-ში',notifyOwner:'მოიჯარის თანხმობა ამ დავის შესახებ Telegram-შეტყობინებებზე დადასტურებულია',submitDispute:'დავის გაგზავნა',disputeError:'დავა ვერ შეინახა. განაახლეთ ბარათი და გადაამოწმეთ ჯარიმის სტატუსი.',paused:'ტაიმერი შეჩერებულია',cabinet:'კაბინეტი',telegram:'Telegram',openedNotice:'დავა დაფიქსირდა',resumedNotice:'გადავადება დასრულდა',payTicket:'კომპანიისთვის გადახდა',needsReview:'გადახდამდე საჭიროა ნაშთის დადასტურება.'});
  Object.assign(labels.ru,{cityPending:'Платёж арендатором городу принят и находится в обработке. Повторная оплата не требуется.',receiptReview:'Квитанция об оплате получена. Платёж проверяется; повторно оплачивать тикет сейчас не нужно.',cityConflict:'Оплата городу подтверждена, но ранее тикет оплатила компания. Возмещение компании проверяется отдельно.'});
  Object.assign(labels.en,{cityPending:'The city has received the renter payment and is processing it. No repeat payment is required.',receiptReview:'Payment receipt received. Verification is in progress; please do not pay this ticket again now.',cityConflict:'Payment to the city is confirmed, but the company had already paid this ticket. Company reimbursement is being reviewed separately.'});
  Object.assign(labels.ka,{cityPending:'ქალაქმა მოიჯარის გადახდა მიიღო და ამუშავებს. ხელახლა გადახდა საჭირო არ არის.',receiptReview:'გადახდის ქვითარი მიღებულია. გადახდა მოწმდება; ამ ჯარიმის ხელახლა გადახდა ახლა საჭირო არ არის.',cityConflict:'ქალაქისთვის გადახდა დადასტურებულია, თუმცა ჯარიმა კომპანიას უკვე ჰქონდა გადახდილი. კომპანიისთვის ანაზღაურება ცალკე მოწმდება.'});
  const deliveryLabels={
    ru:{sent:'отправлено',failed:'не удалось отправить',uncertain:'результат отправки неизвестен',unavailable:'отправка недоступна',pending:'ожидает отправки',sending:'отправляется',cancelled:'отменено',superseded:'заменено актуальным уведомлением',unknown:'статус уточняется'},
    en:{sent:'sent',failed:'could not be sent',uncertain:'sending outcome unknown',unavailable:'sending unavailable',pending:'waiting to send',sending:'sending',cancelled:'cancelled',superseded:'replaced by the current update',unknown:'status under review'},
    ka:{sent:'გაგზავნილია',failed:'ვერ გაიგზავნა',uncertain:'გაგზავნის შედეგი უცნობია',unavailable:'გაგზავნა მიუწვდომელია',pending:'ელოდება გაგზავნას',sending:'იგზავნება',cancelled:'გაუქმებულია',superseded:'ჩანაცვლებულია აქტუალური შეტყობინებით',unknown:'სტატუსი ზუსტდება'}
  };
  // Compact renter copy is separate from the full operator presentation.
  const concise={
    ru:{open:'Открытые',closed:'Закрытые',due:'К оплате',face:'Сумма тикета',paid:'Оплачено',unpaid:'Не оплачено',repay:'Возместить компании',review:'Оплата уточняется',receipt:'Квитанция на проверке',processing:'Оплата в обработке',conflict:'Возмещение уточняется',noRepeat:'Повторно оплачивать не нужно.',conflictNote:'Оплата городу получена. Проверяем расчёт с компанией.',deadline:'Оплатить до',deadlineReview:'Срок оплаты уточняется',overdue:'Просрочка',notice:'Уведомление',block:'Блокировка с (НЙ)',paused:'Диспут: таймер на паузе',pauseUntil:'Пауза до (НЙ)',left:'Осталось',reached:'Срок наступил',unconfirmed:'Блокировка ещё не подтверждена.',dispute:'Оспорить',pauseRule:'Пауза на 14 суток, затем таймер продолжится. Обращение в компанию не заменяет диспут в городе.'},
    en:{open:'Open',closed:'Closed',due:'Amount due',face:'Ticket amount',paid:'Paid',unpaid:'Unpaid',repay:'Reimburse company',review:'Payment under review',receipt:'Receipt under review',processing:'Payment processing',conflict:'Reimbursement under review',noRepeat:'No repeat payment needed.',conflictNote:'City payment received. We are checking company reimbursement.',deadline:'Pay by',deadlineReview:'Payment deadline under review',overdue:'Overdue',notice:'Notified',block:'Blocking from (NY)',paused:'Dispute: countdown paused',pauseUntil:'Paused until (NY)',left:'Time left',reached:'Scheduled time reached',unconfirmed:'Blocking has not been confirmed.',dispute:'Dispute ticket',pauseRule:'Paused for 14 days, then the countdown resumes. Contacting the company does not file a city dispute.'},
    ka:{open:'ღია',closed:'დახურული',due:'გადასახდელი',face:'ჯარიმის თანხა',paid:'გადახდილია',unpaid:'გადაუხდელია',repay:'კომპანიისთვის ასანაზღაურებელი',review:'გადახდა მოწმდება',receipt:'ქვითარი მოწმდება',processing:'გადახდა მუშავდება',conflict:'ანაზღაურება მოწმდება',noRepeat:'ხელახლა გადახდა საჭირო არ არის.',conflictNote:'ქალაქმა გადახდა მიიღო. კომპანიასთან ანგარიშსწორებას ვამოწმებთ.',deadline:'გადახდის ვადა',deadlineReview:'გადახდის ვადა ზუსტდება',overdue:'ვადაგადაცილება',notice:'შეტყობინება',block:'ბლოკირება (NY)',paused:'დავა: ტაიმერი შეჩერებულია',pauseUntil:'პაუზა სრულდება (NY)',left:'დარჩენილია',reached:'დაგეგმილი დრო დადგა',unconfirmed:'ბლოკირება ჯერ არ დადასტურებულა.',dispute:'გასაჩივრება',pauseRule:'14-დღიანი პაუზის შემდეგ ტაიმერი გაგრძელდება. კომპანიისთვის მიმართვა ქალაქში დავის შეტანას არ ნიშნავს.'}
  };
  function renterSettled(row){
    const p=row.payment||{};
    return !p.receipt_review_pending&&!p.city_company_conflict&&settled(row);
  }
  function shortStamp(value,lang,withTime=false){
    const dateOnly=typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
    const d=new Date(dateOnly?value+'T12:00:00Z':value);
    if(!value||!Number.isFinite(d.getTime()))return null;
    const locale=lang==='ru'?'ru-RU':lang==='ka'?'ka-GE':'en-US';
    return d.toLocaleString(locale,{timeZone:dateOnly?'UTC':'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',...(withTime&&!dateOnly?{hour:'2-digit',minute:'2-digit'}:{})});
  }
  function renterCard(card,row,text,lang){
    const c=concise[lang],p=row.payment||{},paid=renterSettled(row);
    const checking=p.receipt_review_pending||p.city_company_conflict;
    const verified=Number.isSafeInteger(p.reimbursement_balance_cents)&&p.reimbursement_balance_cents>=0;
    const top=node('div','th-card-top'),identity=node('div','th-identity');
    identity.append(node('h3','','№ '+(row.ticket_number||'—')));
    identity.append(node('p','th-meta',[row.plate,shortStamp(row.violation_at,lang)].filter(Boolean).join(' · ')));
    const amount=node('div','th-amount');
    const shownAmount=verified&&!checking&&!row.training?p.reimbursement_balance_cents:row.amount_cents;
    amount.append(node('span','th-amount-label',verified&&!checking&&!row.training?c.due:c.face),node('strong','th-amount-value',Number.isSafeInteger(shownAmount)&&shownAmount>=0?money(shownAmount,text):'—'));
    top.append(identity,amount);card.append(top);
    const paused=row.dispute_phase==='paused'||row.blocking_status==='dispute_hold'||['review_pending','confirmed_submitted'].includes(row.dispute_status);
    const state=checking?(p.city_company_conflict?c.conflict:c.receipt):p.tenant_city_payment_pending?c.processing:paid?c.paid:verified&&p.reimbursement_balance_cents>0?(p.company_paid?c.repay:c.unpaid):p.company_paid?c.conflict:c.review;
    const badge=node('p','th-renter-state '+(paid?'is-paid':checking?'is-review':verified?'is-open':'is-review'),row.training?text.training:state);if(!paused||paid||checking)card.append(badge);
    if(p.city_company_conflict)card.append(node('p','th-short-note',c.conflictNote));
    else if(p.receipt_review_pending||p.tenant_city_payment_pending)card.append(node('p','th-short-note',c.noRepeat));
    const fields=node('dl','th-essentials');
    function field(k,v,cls=''){const dt=node('dt',cls,k),dd=node('dd',cls,v);fields.append(dt,dd);}
    if(!paid&&!checking&&!row.training&&!paused){
      const deadline=shortStamp(row.deadline_exclusive,lang,true);
      if(deadline)field(c.deadline,deadline);else card.append(node('p','th-short-note',c.deadlineReview));
      const late=overdue(row,text);
      if(!paused&&deadline&&late!==text.noOverdue&&late!==text.pending&&late!==text.paymentReview&&late!==text.blockHold)field(c.overdue,late);
    }
    if(row.first_notification_at)field(c.notice,shortStamp(row.first_notification_at,lang,true),'th-desktop-detail');
    if(fields.children.length)card.append(fields);
    if(!paid&&!checking&&!row.training){
      if(paused){
        const hold=node('div','th-timeline is-paused');hold.append(node('strong','',c.paused));
        const until=shortStamp(row.dispute_hold_until,lang,true);
        if(until){hold.append(node('span','',c.pauseUntil+': '+until));const timer=node('span','th-pause-countdown');timer.dataset.pauseUntil=row.dispute_hold_until;hold.append(timer);}
        card.append(hold);
      }else if(['scheduled','due'].includes(row.blocking_status)&&shortStamp(row.blocking_at,lang,true)){
        const box=node('div','th-timeline is-scheduled');
        box.append(node('span','',c.block+': '+shortStamp(row.blocking_at,lang,true)));
        const timer=node('strong','th-blocking-countdown');timer.dataset.until=row.blocking_at;
        timer.dataset.compact='true';box.append(timer);card.append(box);
      }
    }
  }
  function notificationStatus(value,text,lang){
    const [event,status]=String(value||'').split(':');
    const name=event==='dispute_opened'?text.openedNotice:event==='dispute_resumed'?text.resumedNotice:null;
    return name?name+(status?' · '+(deliveryLabels[lang][status]||deliveryLabels[lang].unknown):''):value;
  }
  function settled(row){const p=row.payment||{};return p.tenant_paid===true||p.debt_written_off===true||p.reimbursement_balance_cents===0;}
  function duration(ms,text){
    const mins=Math.max(0,Math.ceil(ms/60000)),days=Math.floor(mins/1440),hours=Math.floor(mins%1440/60);
    return days+' '+text.days+' '+hours+' '+text.hours+' '+(mins%60)+' '+text.minutes;
  }
  function overdue(row,text){
    if(settled(row))return text.noOverdue;
    if(row.payment?.receipt_review_pending||row.payment?.city_company_conflict)return text.paymentReview;
    const due=Date.parse(row.deadline_exclusive);
    if(!Number.isFinite(due))return text.pending;
    let asOf=Date.now();
    const pauseStart=Date.parse(row.dispute_started_at),pauseEnd=Date.parse(row.dispute_hold_until);
    if(Number.isFinite(pauseStart)&&Number.isFinite(pauseEnd)&&asOf>=pauseStart)asOf-=Math.max(0,Math.min(asOf,pauseEnd)-pauseStart);
    if(asOf<=due)return text.noOverdue;
    const p=row.payment||{};
    if(row.dispute_status==='review_pending'||row.dispute_status==='confirmed_submitted')return text.blockHold;
    if(!(p.categories||[]).includes('unpaid')&&!['not_reimbursed','partially_reimbursed'].includes(p.reimbursement_status))return text.paymentReview;
    return duration(asOf-due,text);
  }
  function node(tag, cls, text) {
    const e = document.createElement(tag); if (cls) e.className=cls;
    if (text !== undefined) e.textContent=String(text); return e;
  }
  function money(cents, text) {
    return Number.isSafeInteger(cents) && cents >= 0 ? '$'+(cents/100).toFixed(2) : text.notKnown;
  }
  function stamp(value, text, lang) {
    if(typeof value==='string'&&value.length===10&&value[4]==='-'&&value[7]==='-'){const d=new Date(value+'T12:00:00Z');if(isNaN(d))return text.notKnown;return d.toLocaleDateString(lang==='ru'?'ru-RU':lang==='ka'?'ka-GE':'en-US',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'});}
    const d = new Date(value); if (!value || isNaN(d)) return text.notKnown;
    return d.toLocaleString(lang==='ru'?'ru-RU':lang==='ka'?'ka-GE':'en-US', {timeZone:'America/New_York',
      year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+text.timezone;
  }
  function mount(root, opts) {
    let records=[], selected='all', generation=0,alive=true,expiryReloaded=false;
    const lang=['ru','en','ka'].includes(opts.language)?opts.language:'ru', text=labels[lang];
    const owner=opts.preview===true;
    let admin=owner&&typeof global.matchMedia==='function'&&global.matchMedia('(min-width:900px)').matches;
    root.replaceChildren(); root.classList.add('ticket-history');root.classList.toggle('th-admin',admin);root.classList.toggle('th-renter',!admin);
    root.classList.toggle('th-owner',owner);
    const header=node('div','th-heading');
    header.append(node('h2','',opts.preview?text.preview:text.title));
    const refresh=node('button','th-refresh',text.refresh); refresh.type='button'; header.append(refresh); root.append(header);
    const ownerNote=node('p','th-note',text.separate);ownerNote.hidden=!admin;if(owner)root.append(ownerNote);
    const status=node('p','th-status'); status.setAttribute('role','status'); root.append(status);
    const filters=node('div','th-filters'); filters.setAttribute('aria-label',text.title); root.append(filters);
    const list=node('div','th-list'); root.append(list);
    if(owner){
      const names={ru:{full:'Подробно',short:'Кратко'},en:{full:'Details',short:'Compact'},ka:{full:'დეტალურად',short:'მოკლედ'}}[lang];
      const toggle=node('button','th-view-toggle',admin?names.short:names.full);toggle.type='button';toggle.setAttribute('aria-pressed',String(admin));header.append(toggle);
      toggle.onclick=()=>{admin=!admin;selected='all';root.classList.toggle('th-admin',admin);root.classList.toggle('th-renter',!admin);ownerNote.hidden=!admin;toggle.textContent=admin?names.short:names.full;toggle.setAttribute('aria-pressed',String(admin));status.textContent=admin&&records.length?text.noTotals:'';render();tick();};
    }
    function render() {
      filters.replaceChildren(); list.replaceChildren();
      const matches=(r,key)=>key==='all'||(admin?(r.payment?.categories||[]).includes(key):key==='closed'?renterSettled(r):!renterSettled(r));
      for (const key of (admin?['all','unpaid','paid_by_renter','paid_by_company','unknown']:records.length>1?['all','open','closed']:[])) {
        const count=records.filter(r=>matches(r,key)).length;
        const b=node('button','th-filter',(admin||key==='all'?text[key]:concise[lang][key])+' · '+count); b.type='button';
        b.dataset.filter=key; b.setAttribute('aria-pressed',String(key===selected));
        b.onclick=()=>{selected=key;render();}; filters.append(b);
      }
      const visible=records.filter(r=>matches(r,selected));
      if (!visible.length) list.append(node('p','th-status',records.length?text.filtered:text.empty));
      for (const row of visible) {
        const card=node('article','th-ticket'); card.dataset.ticketId=row.id;
        const p=row.payment||{};
        if(!admin){renterCard(card,row,text,lang);list.append(card);}else{
        card.append(node('h3','','№ '+(row.ticket_number||'—')));
        card.append(node('p','th-plate',row.plate||'—'));
        if (row.training) card.append(node('p','th-test',text.training));
        const badges=node('div','th-badges');
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
        if(row.dispute_phase){
          field(text.disputeStarted,stamp(row.dispute_started_at,text,lang));
          field(text.reason,row.dispute_reason||'—');
          if(row.dispute_phase!=='closed'){
            field(text.holdUntil,stamp(row.dispute_hold_until,text,lang));
            field(text.remainingAfter,duration(row.dispute_remaining_seconds*1000,text));
          }
        }
        if(row.blocking_at&&!settled(row)){
          const timer=node('dd','th-blocking-countdown');timer.dataset.until=row.blocking_at;
          if(row.dispute_phase==='paused')timer.dataset.pauseUntil=row.dispute_hold_until;
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
        if(p.tenant_city_payment_pending)card.append(node('p','th-note',text.cityPending));
        if(p.receipt_review_pending)card.append(node('p','th-hold',text.receiptReview));
        if(p.city_company_conflict)card.append(node('p','th-hold',text.cityConflict));
        if(row.blocking_status==='payment_review')card.append(node('p','th-note',text.blockReview));
        if(row.blocking_status==='dispute_hold')card.append(node('p','th-hold',text.blockHold));
        if(row.dispute_phase==='resumed')card.append(node('p','th-note',text.resume));
        if(['review_pending','confirmed_submitted'].includes(row.dispute_status)) card.append(node('p','th-hold',text.dispute));
        const details=node('details','th-notifications'); details.append(node('summary','',text.notifications));
        for(const n of row.notifications||[])details.append(node('p','',
          stamp(n.at,text,lang)+' · '+(n.channel==='cabinet'?text.cabinet:n.channel)+' · '+notificationStatus(n.status,text,lang)+(n.simulated?' · TEST':'')));
        if(!(row.notifications||[]).length)details.append(node('p','',text.noNotice));
        card.append(details); list.append(card);
        }
        if(row.dispute_can_submit===true&&opts.submitDispute){
          const section=node('details','th-dispute');section.append(node('summary','',admin?text.disputeTitle:concise[lang].dispute));
          const form=node('form','th-dispute-form'),label=node('label','',text.reason),reason=node('textarea','th-dispute-reason');reason.required=true;reason.minLength=5;reason.maxLength=1000;reason.rows=3;reason.setAttribute('aria-label',text.reason);label.append(reason);
          const note=node('p','th-note',admin?text.pauseRule:concise[lang].pauseRule),choice=node('label','th-dispute-notify'),notify=node('input');notify.type='checkbox';notify.checked=!opts.preview;choice.append(notify,document.createTextNode(opts.preview?text.notifyOwner:text.notify));
          const submit=node('button','th-dispute-submit',text.submitDispute);submit.type='submit';const error=node('p','th-status');error.setAttribute('role','status');
          form.append(label,note,choice,submit,error);section.append(form);card.append(section);
          form.onsubmit=async event=>{event.preventDefault();if(submit.disabled||!form.reportValidity())return;submit.disabled=true;reason.disabled=true;error.textContent='';try{await opts.submitDispute({ticket_id:row.id,reason:reason.value.trim(),notify_telegram:notify.checked,language:lang});if(alive)await load();}catch{if(alive){error.textContent=text.disputeError;submit.disabled=false;reason.disabled=false;}}};
        }
        if(opts.onPay&&global.RenterPayments){
          if(global.RenterPayments.payableTicket(row)){
            const pay=node('button','th-pay',text.payTicket);pay.type='button';pay.onclick=()=>opts.onPay(row);card.append(pay);
          }else if(admin&&!settled(row)&&!row.training&&!row.dispute_status){card.append(node('p','th-pay-note',text.needsReview));}
        }
      }
    }
    function tick(){
      for(const timer of list.querySelectorAll('.th-pause-countdown')){
        const end=Date.parse(timer.dataset.pauseUntil);
        if(Number.isFinite(end)&&end>Date.now())timer.textContent=concise[lang].left+': '+duration(end-Date.now(),text);
        else if(!expiryReloaded){expiryReloaded=true;load();return;}
      }
      for(const timer of list.querySelectorAll('.th-blocking-countdown')){
        const pause=Date.parse(timer.dataset.pauseUntil);
        if(Number.isFinite(pause)&&pause>Date.now()){timer.textContent=text.paused+' · '+duration(pause-Date.now(),text);continue;}
        if(Number.isFinite(pause)&&!expiryReloaded){expiryReloaded=true;load();return;}
        const remaining=Date.parse(timer.dataset.until)-Date.now();
        timer.textContent=Number.isFinite(remaining)?remaining<=0?(timer.dataset.compact?concise[lang].reached+' · '+concise[lang].unconfirmed:text.blockDue):(timer.dataset.compact?concise[lang].left+': ':'')+duration(remaining,text):text.notStarted;
      }
    }
    const ticker=setInterval(tick,1000);
    async function load(){
      const mine=++generation; records=[]; filters.replaceChildren(); list.replaceChildren();
      status.textContent=text.loading; refresh.disabled=true;
      try {
        const data=await opts.load(); if(mine!==generation||!root.isConnected)return;
        if(!data||data.ok!==true||!Array.isArray(data.tickets))throw Error('invalid history');
        records=data.tickets; status.textContent=admin?text.noTotals:''; render();tick();
      } catch(_){if(mine===generation){status.textContent=text.error;list.replaceChildren();filters.replaceChildren();}}
      finally {if(mine===generation)refresh.disabled=false;}
    }
    refresh.onclick=load; load();
    return {reload:load, destroy(){alive=false;generation++;clearInterval(ticker);root.replaceChildren();}};
  }
  global.TicketHistory={mount};
})(window);
