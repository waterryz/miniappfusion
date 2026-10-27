(function(global){
 'use strict';
 const words={
  ru:{title:'День аренды в подарок на день рождения',rules:'Один бесплатный день каждый год. Повторно отправьте TLC и DMV-лицензию и подтвердите подписку на SMS и WhatsApp. До конца дня рождения по Нью-Йорку нужно погасить все долги по аренде, тикетам и другим обязательствам. Если долг останется, подарочный день сгорает без переноса.',date:'День рождения · день.месяц',sms:'Согласен получать информационные SMS от Prime Fusion',wa:'Согласен получать информационные сообщения Prime Fusion в WhatsApp',optout:'Согласия можно отозвать здесь, сняв отметку и сохранив изменения. Опубликованное объявление не означает вашу подписку.',save:'Сохранить дату и согласия',saved:'Сохранено. Новую дату компания сверит с документами.',error:'Не удалось подтвердить сохранение. Повторите позже.',loading:'Проверяем условия…',unavailable:'Сведения временно недоступны.',tlc:'Повторно загрузить TLC',dmv:'Повторно загрузить DMV-лицензию',verified:'проверено',pending:'ожидает проверки',missing:'нужен документ',review:'Требуется сверка',upcoming:'Подарочный день впереди',today:'День рождения сегодня · условия проверяются до полуночи',awarded:'Подарочный день подтверждён',used:'Подарочный день учтён в аренде',expired:'Подарочный день за этот год не предоставлен',birthday_required:'Укажите день и месяц рождения',inactive:'Аренда неактивна',uploading:'Документ загружается…',uploaded:'Документ получен и ожидает проверки.',fileError:'Выберите JPG или PNG не более 10 МБ.',dateError:'Укажите существующий день и месяц, например 02.11.',preview:'Просмотр владельца · согласия за арендатора не изменяются',newDate:'Дата ожидает подтверждения по документам'},
  en:{title:'A free rental day on your birthday',rules:'One free day each year. Resubmit your TLC and DMV driver licenses and opt in to SMS and WhatsApp updates. Clear all rent, ticket and other due debts by the end of your birthday in New York time. Otherwise this year’s day expires and does not roll over.',date:'Birthday · day.month',sms:'I agree to receive Prime Fusion informational text messages',wa:'I agree to receive Prime Fusion informational WhatsApp messages',optout:'You can withdraw either consent here by unchecking it and saving. An announcement does not enroll you.',save:'Save birthday and consents',saved:'Saved. The company will verify a new birthday against your documents.',error:'Could not confirm saving. Please try again later.',loading:'Checking conditions…',unavailable:'Birthday information is temporarily unavailable.',tlc:'Resubmit TLC license',dmv:'Resubmit DMV license',verified:'verified',pending:'awaiting review',missing:'document required',review:'Verification required',upcoming:'Birthday day is upcoming',today:'Birthday today · conditions checked until midnight',awarded:'Free day confirmed',used:'Free day applied to rent',expired:'No free day granted for this year',birthday_required:'Enter your birthday day and month',inactive:'Rental is inactive',uploading:'Uploading document…',uploaded:'Document received and awaiting verification.',fileError:'Choose JPG or PNG, up to 10 MB.',dateError:'Enter a valid day and month, for example 02.11.',preview:'Owner preview · renter consents cannot be changed here',newDate:'Birthday awaiting document verification'},
  ka:{title:'დაბადების დღეზე — ქირის ერთი უფასო დღე',rules:'ყოველ წელს ერთი უფასო დღე. ხელახლა გამოგზავნეთ TLC და DMV მართვის მოწმობები და დაეთანხმეთ SMS-სა და WhatsApp-ში საინფორმაციო შეტყობინებების მიღებას. დაბადების დღის ბოლომდე, ნიუ-იორკის დროით, დაფარეთ ქირის, ჯარიმებისა და სხვა ვალდებულებების დავალიანება. წინააღმდეგ შემთხვევაში ამ წლის საჩუქარი გაუქმდება და სხვა დღეზე არ გადავა.',date:'დაბადების დღე · დღე.თვე',sms:'თანახმა ვარ მივიღო Prime Fusion-ის საინფორმაციო SMS-ები',wa:'თანახმა ვარ მივიღო Prime Fusion-ის საინფორმაციო შეტყობინებები WhatsApp-ში',optout:'თანხმობის გაუქმება შეგიძლიათ მონიშვნის მოხსნით და შენახვით. განცხადების მიღება გამოწერას არ ნიშნავს.',save:'თარიღისა და თანხმობების შენახვა',saved:'შენახულია. ახალ თარიღს კომპანია საბუთებით გადაამოწმებს.',error:'შენახვა ვერ დადასტურდა. სცადეთ მოგვიანებით.',loading:'პირობები მოწმდება…',unavailable:'ინფორმაცია დროებით მიუწვდომელია.',tlc:'TLC-ის ხელახლა ატვირთვა',dmv:'DMV-ის ხელახლა ატვირთვა',verified:'გადამოწმებულია',pending:'ელოდება შემოწმებას',missing:'საჭიროა საბუთი',review:'საჭიროა გადამოწმება',upcoming:'საჩუქრის დღე წინ არის',today:'დღეს დაბადების დღეა · პირობები შუაღამემდე მოწმდება',awarded:'უფასო დღე დადასტურებულია',used:'უფასო დღე ქირაში ჩაითვალა',expired:'ამ წლის უფასო დღე არ გაიცა',birthday_required:'მიუთითეთ დაბადების დღე და თვე',inactive:'ქირაობა არააქტიურია',uploading:'საბუთი იტვირთება…',uploaded:'საბუთი მიღებულია და ელოდება შემოწმებას.',fileError:'აირჩიეთ JPG ან PNG, მაქსიმუმ 10 მბ.',dateError:'მიუთითეთ სწორი დღე და თვე, მაგალითად 02.11.',preview:'მფლობელის ნახვის რეჟიმი · მოიჯარის თანხმობები არ იცვლება',newDate:'თარიღი ელოდება საბუთებით გადამოწმებას'}
 };
 function el(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
 function mount(root,opts){
  const t=words[opts.language]||words.ru;let alive=true,view=null,busy=false;
  root.classList.add('pf-birthday');root.replaceChildren();
  root.append(el('h2',t.title));
  const details=el('details'),summary=el('summary',({ru:'Условия и участие',en:'Conditions and participation',ka:'პირობები და მონაწილეობა'})[opts.language]||'Условия и участие');details.append(summary,el('p',t.rules));
  const status=el('p',t.loading);status.setAttribute('role','status');root.append(status,details);
  const form=el('form'),dateLabel=el('label',t.date),dateInput=el('input');dateInput.type='text';dateInput.inputMode='decimal';dateInput.placeholder='02.11';dateInput.maxLength=5;dateInput.autocomplete='bday';dateLabel.append(dateInput);
  const smsLabel=el('label'),sms=el('input');sms.type='checkbox';smsLabel.append(sms,document.createTextNode(t.sms));
  const waLabel=el('label'),wa=el('input');wa.type='checkbox';waLabel.append(wa,document.createTextNode(t.wa));
  const save=el('button',t.save);save.type='submit';form.append(dateLabel,smsLabel,waLabel,el('p',t.optout),save);
  const msg=el('p');msg.setAttribute('role','status');form.append(msg);details.append(form);
  const docs=el('div');docs.className='pf-birthday-docs';details.append(docs);
  function requestID(){return global.crypto?.randomUUID?.()||'birthday-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
  function draw(v){
   view=v;const md=v.requested_month_day||v.birthday_month_day||'';dateInput.value=md.length===5?md.slice(3)+'.'+md.slice(0,2):'';
   sms.checked=(v.current_consents||v.consents)?.sms===true;wa.checked=(v.current_consents||v.consents)?.whatsapp===true;
   const key=v.status==='birthday_today'||v.status==='checking_conditions'?'today':v.status;
   status.textContent=(t[key]||t.review)+(v.benefit_date?' · '+new Date(v.benefit_date+'T12:00:00Z').toLocaleDateString(opts.language==='en'?'en-US':opts.language==='ka'?'ka-GE':'ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}):'')+(v.birthday_confirmation_pending?' · '+t.newDate:'');
   docs.replaceChildren();
   for(const kind of ['tlc','dmv']){
    const row=el('div'),label=el('label',(kind==='tlc'?'TLC':'DMV')+' · '+(t[v.docs?.[kind]]||t.missing));
    const input=el('input');input.type='file';input.accept='image/jpeg,image/png';input.setAttribute('aria-label',t[kind]);input.disabled=!!opts.preview;label.append(input);row.append(label);
    input.addEventListener('change',async()=>{
     const file=input.files?.[0];if(!file||busy)return;
     if(!['image/jpeg','image/png'].includes(file.type)||file.size>10*1024*1024){msg.textContent=t.fileError;input.value='';return;}
     busy=true;save.disabled=true;input.disabled=true;msg.textContent=t.uploading;
     try{const image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});await opts.upload(kind,{image,name:'birthday-'+kind,birthday_document_type:kind});msg.textContent=t.uploaded;await load();}
     catch(_){msg.textContent=t.error;}finally{busy=false;save.disabled=!!opts.preview;input.disabled=!!opts.preview;input.value='';}
    });docs.append(row);
   }
   for(const item of [dateInput,sms,wa,save])item.disabled=!!opts.preview;
   if(opts.preview)msg.textContent=t.preview;
  }
  async function load(){try{const r=await opts.load();if(alive&&r?.ok&&r.birthday)draw(r.birthday);else if(alive)status.textContent=t.unavailable;}catch(_){if(alive)status.textContent=t.unavailable;}}
  form.addEventListener('submit',async ev=>{
   ev.preventDefault();if(opts.preview||busy||!view)return;
   const match=/^(\d{2})\.(\d{2})$/.exec(dateInput.value.trim());
   if(!match){msg.textContent=t.dateError;return;}
   const md=match[2]+'-'+match[1],d=new Date('2000-'+md+'T12:00:00Z');if(isNaN(d)||d.toISOString().slice(5,10)!==md){msg.textContent=t.dateError;return;}
   busy=true;save.disabled=true;
   try{const r=await opts.save({month_day:md,sms_enabled:sms.checked,whatsapp_enabled:wa.checked,policy_version:view.policy_version,request_id:requestID()});if(!r?.ok||!r.birthday)throw Error('not confirmed');if(alive){draw(r.birthday);msg.textContent=t.saved;}}
   catch(_){if(alive)msg.textContent=t.error;}finally{busy=false;if(alive)save.disabled=!!opts.preview;}
  });
  load();return {destroy(){alive=false;root.replaceChildren();}};
 }
 global.BirthdayDay={mount};
})(window);
