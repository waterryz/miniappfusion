(function(global){
  'use strict';
  const dictionary={
    ru:{title:'Бонусные баллы',test:'ТЕСТОВЫЙ РЕЖИМ',note:'Баллы начисляются и списываются в тестовом режиме. Использовать их нельзя. В действительный баланс 1 января 2027 года они не перейдут.',
      loading:'Загружаем баланс…',error:'Баланс временно недоступен.',empty:'Операций пока нет.',none:'Участие в тесте не включено.',refresh:'Обновить',history:'История операций',pending:'Часть событий ожидает подтверждения данных.',start:'Начало теста',closed:'Тест завершён. Эти баллы недействительны.',correction:'Корректировка',
      accrual_week:'Полная неделя',accrual_month:'Полный месяц',accrual_halfyear:'Полгода',accrual_year:'Год',rent_overdue:'Просрочка аренды',ticket_overdue:'Просрочка оплаты тикета или толла',confirmation_overdue:'Нет подтверждения сообщения',speed:'Скорость 85 mph и выше',at_fault_crash:'ДТП по вине водителя',crash_data_missing:'Не собраны необходимые данные после ДТП',dmv_late:'Пропущен срок инспекции DMV',service_late:'Пропущен срок обслуживания',form_error:'Ошибка в отчёте или бланке DMV',service_report_late:'Отчёт после сервиса не отправлен в течение часа',notice_received:'Получено уведомление о тикете или толле',parking:'Парковочный тикет',speed_ticket:'Тикет за скорость',red_light:'Проезд на красный',mta_camera:'Камера автобуса MTA',unauthorized_trip:'Поездка дальше 300 миль без согласования',insurance_recording_denied:'Нет записи ДТП, подтверждён отказ в страховой выплате',crash_help:'Профессиональные действия после ДТП',retest:'Тест пройден без ошибок'},
    en:{title:'Bonus points',test:'TEST MODE',note:'Points are earned and deducted in test mode. They cannot be used and will not transfer to the real balance on January 1, 2027.',loading:'Loading balance…',error:'Balance is temporarily unavailable.',empty:'No entries yet.',none:'Test participation is not enabled.',refresh:'Refresh',history:'Activity',pending:'Some events are awaiting verified information.',start:'Test started',closed:'The test has ended. These points are not valid.',correction:'Correction',accrual_week:'Full week',accrual_month:'Full month',accrual_halfyear:'Six months',accrual_year:'Full year',rent_overdue:'Late rent',ticket_overdue:'Overdue ticket or toll',confirmation_overdue:'Message not acknowledged',speed:'Speed of 85 mph or above',at_fault_crash:'At-fault crash',crash_data_missing:'Required crash details missing',dmv_late:'DMV inspection overdue',service_late:'Service overdue',form_error:'Incomplete or unreadable report or DMV form',service_report_late:'Service report not submitted within one hour',notice_received:'Ticket or toll notice received',parking:'Parking ticket',speed_ticket:'Speeding ticket',red_light:'Red light ticket',mta_camera:'MTA bus camera ticket',unauthorized_trip:'Trip beyond 300 miles without approval',insurance_recording_denied:'Missing crash recording caused an insurance denial',crash_help:'Professional assistance after a crash',retest:'Perfect test result'}
  };
  function el(tag,cls,text){const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=String(text);return n;}
  function mount(root,opts){
    const lang=opts.language==='en'?'en':'ru',t=dictionary[lang];let generation=0;
    root.replaceChildren();root.classList.add('bonus-trial');
    const head=el('div','bt-head'),title=el('h2','',t.title),refresh=el('button','bt-refresh',t.refresh);refresh.type='button';head.append(title,refresh);root.append(head,el('span','bt-badge',t.test),el('p','bt-note',t.note));
    const status=el('p','bt-status');status.setAttribute('role','status');const body=el('div','bt-body');root.append(status,body);
    function date(s){const d=new Date(s);return !s||isNaN(d)?'—':d.toLocaleString(lang==='ru'?'ru-RU':'en-US',{timeZone:'America/New_York',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
    async function load(){const mine=++generation;status.textContent=t.loading;body.replaceChildren();refresh.disabled=true;
      try{const data=await opts.load();if(mine!==generation||!root.isConnected)return;
        if(data?.ok!==true||data.mode!=='test'||!Array.isArray(data.entries))throw Error('bad trial');
        if(!data.enrolled){status.textContent=t.none;return;}
        if(!Number.isSafeInteger(data.balance))throw Error('bad balance');
        status.textContent=data.closed?t.closed:(data.holds?.length?t.pending:'');
        const total=el('div','bt-total',data.balance.toLocaleString(lang==='ru'?'ru-RU':'en-US'));total.dataset.balance=String(data.balance);body.append(total,el('p','bt-start',t.start+' · '+date(data.started_at)));
        const details=el('details','bt-history');details.open=true;details.append(el('summary','',t.history));
        if(!data.entries.length)details.append(el('p','bt-note',t.empty));
        for(const row of [...data.entries].reverse()){
          if(!Number.isSafeInteger(row.delta)||!Number.isSafeInteger(row.balance))throw Error('bad entry');
          const item=el('article','bt-entry'),parts=String(row.reason).split(':'),key=parts[parts.length-1];
          item.append(el('span','bt-reason',(parts[0]==='correction'?t.correction+' · ':'')+(t[key]||t.correction)),el('strong',row.delta<0?'bt-minus':'bt-plus',(row.delta>0?'+':'')+row.delta),el('small','bt-date',date(row.occurred_at)),el('small','bt-rest',String(row.balance)));
          details.append(item);
        }body.append(details);
      }catch(_){if(mine===generation){status.textContent=t.error;body.replaceChildren();}}
      finally{if(mine===generation)refresh.disabled=false;}}
    refresh.onclick=load;load();return{reload:load,destroy(){generation++;root.replaceChildren();}};
  }
  global.BonusTrial={mount};
})(window);
