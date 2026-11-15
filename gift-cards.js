/* Approved artwork; this composer prepares a request, never an issued certificate. */
(()=>{
'use strict';
const M=window.CoyliGiftCards;
const state={format:'electronic',amount:3000,design:'hug',wish:'',recipient:'',sender:'',step:0};
const plastic={1500:'assets/gifts/card-heart.png',3000:'assets/gifts/card-bow.png',5000:'assets/gifts/card-gift.png'};
const descriptions={hug:'Тёплые объятия, даже если вы далеко.',love:'Для слов, которые хочется сказать лично.',bloom:'Пусть каждый день будет чуть светлее.',chrome:'Сдержанный блеск. Особенный подарок.',rug:'Знакомое чувство: ты там, где тебя любят.',blanket:'Забота, которую почти можно потрогать.',game:'Новый аромат — новый уровень настроения.',heart:'Когда всё самое важное — от сердца.',bow:'Тот самый повод сделать красиво.',gift:'Большая радость в маленьком подарке.'};
const wishes={birthday:'С днём рождения! Пусть впереди будет много счастливых моментов и любимых ароматов.',love:'С любовью — и с желанием сделать твой день немного счастливее.',just:'Просто так. Потому что ты — прекрасный повод для подарка.'};
const root=()=>document.getElementById('gift-section');
const el=id=>root().querySelector('#'+id);
const design=()=>M.designs.find(d=>d.id===state.design);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let serial=0,wheelValues=[],wheelTimer,paintFrame,ignoreWheel=false,drag=null,customValue=3000,electronicAmount=3000;
function preview(d,amount,thumb=false){
 const value=M.validAmount(amount)?M.money(amount):'Ваша сумма';
 const size=Math.min(d.size,d.size*7/value.replace(/\s/g,'').length);
 const id='gift-thread-'+(++serial);
 // A live thread pattern keeps every denomination in the textile artwork's material.
 const thread=d.tone==='thread';
 const defs=thread?`<defs><pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="9" height="9" fill="#00348a"/><path d="M0 2H9" stroke="#073f9c" stroke-width="4.5"/><path d="M0 1H9" stroke="#4b7dcc" stroke-width="1.5"/><path d="M0 5H9" stroke="#002665" stroke-width="1.1"/><path d="M2 0V9M6 0V9" stroke="#86a4d8" stroke-opacity=".24" stroke-width=".7"/></pattern><filter id="${id}-edge" x="-8%" y="-15%" width="116%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".23" numOctaves="2" seed="7" result="fiber"/><feDisplacementMap in="SourceGraphic" in2="fiber" scale="2" xChannelSelector="R" yChannelSelector="G"/><feDropShadow dx=".8" dy="2" stdDeviation="1.2" flood-color="#28334a" flood-opacity=".38"/></filter></defs>`:'';
 const text=thread?`<text x="${d.x}" y="${d.y}" style="font-size:${size}px;fill:url(#${id});stroke:#12418e;stroke-width:1.5;stroke-dasharray:2 1;paint-order:stroke fill" filter="url(#${id}-edge)">${esc(value)}</text>`:`<text x="${d.x}" y="${d.y}" style="font-size:${size}px">${esc(value)}</text>`;
 return `<span class="gift-artwork"><img ${thumb?'loading="lazy"':''} src="${d.image}" alt="${thumb?'':esc(d.label)}" width="1600" height="1000" decoding="async"><svg class="gift-amount-layer gift-amount-${d.tone||'blue'}" viewBox="0 0 1600 1000" aria-hidden="true">${defs}${text}</svg></span>`;
}
function invalidate(){el('gift-order-details').hidden=true;el('gift-copy-status').textContent='';}
function updatePreview(){
 const electronic=state.format==='electronic',d=design(),valid=M.validAmount(state.amount);
 el('gift-electronic-preview').hidden=!electronic;el('gift-physical-preview').hidden=electronic;
 el('gift-electronic-preview').innerHTML=preview(d,state.amount);
 el('gift-preview-caption').textContent=electronic?d.label:'Пластиковая подарочная карта';
 el('gift-preview-value').textContent=valid?M.money(state.amount):'Выберите сумму';
 el('gift-design-description').textContent=descriptions[d.id];
 el('gift-selected-name').textContent=d.label;
 el('gift-design-count').textContent=(M.designs.indexOf(d)+1)+' / '+M.designs.length;
 el('gift-physical-image').src=plastic[state.amount]||plastic[3000];
 el('gift-physical-image').alt='Пластиковая подарочная карта на '+M.money(plastic[state.amount]?state.amount:3000);
 el('gift-live-amount').textContent=valid?M.money(state.amount):'— ₽';
 root().querySelectorAll('[data-gift-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftFormat===state.format)));
 root().querySelectorAll('[data-gift-design]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftDesign===state.design)));
 root().querySelectorAll('[data-gift-amount]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.giftAmount)===state.amount)));
 updateWish();invalidate();
}
function updateWish(){
 const show=state.format==='electronic'&&!!(state.wish.trim()||state.recipient.trim()||state.sender.trim());
 el('gift-message-preview').hidden=!show;
 el('gift-message-recipient').textContent=state.recipient.trim()?state.recipient.trim()+',':'';
 el('gift-message-body').textContent=state.wish.trim();
 el('gift-message-sender').textContent=state.sender.trim();
 el('gift-wish-count').textContent=state.wish.length+' / 300';invalidate();
}
function amountError(show){
 el('gift-error').hidden=!show;
 el('gift-custom-amount').setAttribute('aria-invalid',String(show));
}
function updateStep(focus=false){
 const electronic=state.format==='electronic';
 root().querySelectorAll('[data-step-panel]').forEach(p=>p.hidden=Number(p.dataset.stepPanel)!==state.step);
 root().querySelectorAll('[data-gift-step]').forEach(b=>{
  const n=Number(b.dataset.giftStep);b.setAttribute('aria-current',n===state.step?'step':'false');b.classList.toggle('is-complete',n<state.step);b.disabled=!electronic;
 });
 el('gift-steps').hidden=!electronic;el('gift-designs').hidden=!electronic;
 el('gift-wheel-field').hidden=!electronic;el('gift-physical-amounts').hidden=electronic;
 el('gift-back').hidden=!electronic||state.step===0;
 el('gift-next').hidden=electronic&&state.step===2;
 el('gift-order').hidden=electronic&&state.step!==2;
 if(!electronic)el('gift-next').hidden=true;
 el('gift-next').textContent=state.step===0?'Далее · сумма':'Далее · поздравление';
 el('gift-step-count').textContent=electronic?'Шаг '+(state.step+1)+' из 3':'Карта на фирменной подложке';
 el('gift-delivery').textContent=electronic?'После оплаты менеджер отправит вам электронную карту. Её можно переслать получателю.':'Пластиковую карту можно забрать в бутике или оформить с доставкой.';
 el('gift-order').textContent='Оформить · '+M.money(state.amount||3000);
 invalidate();
 if(state.step===1&&electronic)requestAnimationFrame(()=>buildWheel());
 if(focus){const h=root().querySelector(`[data-step-panel="${state.step}"] h3`);h?.focus({preventScroll:true});}
}
function goStep(step){
 if(step===2&&!M.validAmount(state.amount)){state.step=1;updateStep();amountError(true);el('gift-custom-amount').focus();return;}
 state.step=step;updateStep(true);
}
function setAmount(n,fromWheel=false){
 state.amount=n;if(state.format==='electronic'&&M.validAmount(n))electronicAmount=n;
 amountError(false);updatePreview();
 if(fromWheel)el('gift-custom-amount').value=n%1000?String(n):'';
}
function paintWheel(){
 const track=el('gift-wheel');if(!track.clientWidth)return;
 const center=track.scrollLeft+track.clientWidth/2;
 [...track.children].forEach(b=>{
  const delta=(b.offsetLeft+b.offsetWidth/2-center)/b.offsetWidth;
  b.firstElementChild.style.transform=`translateY(${Math.min(70,delta*delta*12)}px) rotate(${delta*9}deg)`;
  b.style.opacity=String(Math.max(.20,1-Math.abs(delta)*.23));
 });
}
function nearestWheel(){const track=el('gift-wheel'),center=track.scrollLeft+track.clientWidth/2;return [...track.children].reduce((a,b)=>Math.abs(b.offsetLeft+b.offsetWidth/2-center)<Math.abs(a.offsetLeft+a.offsetWidth/2-center)?b:a);}
function syncWheelSelection(n){
 const track=el('gift-wheel');track.setAttribute('aria-activedescendant','gift-nominal-'+n);
 [...track.children].forEach(b=>b.setAttribute('aria-selected',String(Number(b.dataset.value)===n)));
 el('gift-wheel-prev').disabled=n<=M.MIN_AMOUNT;el('gift-wheel-next').disabled=n>=M.MAX_AMOUNT;
}
function centerWheel(n,animate=false){
 const track=el('gift-wheel'),b=el('gift-nominal-'+n);if(!b)return;
 track.scrollTo({left:b.offsetLeft+b.offsetWidth/2-track.clientWidth/2,behavior:animate&&!reduced()?'smooth':'instant'});
 syncWheelSelection(n);paintWheel();
}
function settleWheel(){
 if(ignoreWheel||drag||state.step!==1||state.format!=='electronic')return;
 const b=nearestWheel();if(!b)return;
 const n=Number(b.dataset.value);setAmount(n,true);syncWheelSelection(n);centerWheel(n);
}
function buildWheel(){
 clearTimeout(wheelTimer);ignoreWheel=true;
 wheelValues=M.wheelAmounts(customValue);
 el('gift-wheel').innerHTML=wheelValues.map(n=>`<div role="option" id="gift-nominal-${n}" data-value="${n}" aria-selected="${n===state.amount}" aria-label="${M.money(n)}"><span>${new Intl.NumberFormat('ru-RU').format(n)}</span></div>`).join('');
 centerWheel(M.validAmount(state.amount)?state.amount:electronicAmount);
 requestAnimationFrame(()=>{paintWheel();requestAnimationFrame(()=>{ignoreWheel=false;});});
}
function moveWheel(delta){
 const current=wheelValues.indexOf(M.validAmount(state.amount)?state.amount:electronicAmount);
 const n=wheelValues[Math.max(0,Math.min(wheelValues.length-1,current+delta))];
 setAmount(n,true);centerWheel(n,true);
}
function selectDesign(id,center=true){state.design=id;updatePreview();if(center){const b=root().querySelector(`[data-gift-design="${id}"]`),rail=el('gift-design-gallery');rail.scrollTo({left:b.offsetLeft-(rail.clientWidth-b.clientWidth)/2,behavior:reduced()?'instant':'smooth'});}}
window.renderGiftSection=function(){
 const r=root();if(!r||r.dataset.ready)return;r.dataset.ready='true';
 r.innerHTML=`<div class="gift-heading"><p class="gift-eyebrow">COYLI · ПОДАРОЧНЫЕ КАРТЫ</p><h2>Дарите по-своему.</h2><p>Настроение — от вас. Любимый аромат — на выбор.</p></div>
 <div class="gift-layout"><div class="gift-preview-col"><div class="gift-preview-stage"><div id="gift-electronic-preview"></div><div id="gift-physical-preview" hidden><img id="gift-physical-image" src="assets/gifts/card-bow.png" alt="Подарочная карта"></div></div>
 <div class="gift-preview-caption"><span id="gift-preview-caption"></span><span id="gift-preview-value"></span></div><p class="gift-preview-note">Предпросмотр · номер карты появится при оформлении</p>
 <div id="gift-message-preview" class="gift-message-preview" hidden><p class="gift-eyebrow">ЛИЧНОЕ ПОСЛАНИЕ</p><p id="gift-message-recipient"></p><p id="gift-message-body"></p><p id="gift-message-sender"></p></div></div>
 <div class="gift-controls"><div class="gift-format" role="group" aria-label="Формат подарочной карты"><button type="button" data-gift-format="electronic" aria-pressed="true">Электронная</button><button type="button" data-gift-format="physical" aria-pressed="false">Пластиковая</button></div>
 <nav class="gift-steps" id="gift-steps" aria-label="Шаги оформления">${['Дизайн','Сумма','Поздравление'].map((s,i)=>`<button type="button" data-gift-step="${i}"><span>${i+1}</span>${s}</button>`).join('')}</nav>
 <div class="gift-step-panel" data-step-panel="0"><h3 tabindex="-1">С каким настроением?</h3><p class="gift-panel-intro">Десять способов сказать: «Я о тебе думаю».</p><div id="gift-designs"><div class="gift-design-gallery" id="gift-design-gallery" role="group" aria-label="Выберите дизайн">${M.designs.map(d=>`<button type="button" data-gift-design="${d.id}" aria-pressed="false">${preview(d,3000,true)}<span class="gift-design-name">${esc(d.label)}</span></button>`).join('')}</div><div class="gift-gallery-tools"><span>Листайте, чтобы выбрать</span><div><button type="button" id="gift-design-prev" aria-label="Предыдущий дизайн">←</button><span id="gift-design-count"></span><button type="button" id="gift-design-next" aria-label="Следующий дизайн">→</button></div></div><p id="gift-selected-name" class="gift-selected-name"></p><p id="gift-design-description" class="gift-panel-intro"></p><button type="button" id="gift-show-all" class="gift-text-button" aria-expanded="false">Все дизайны</button></div></div>
 <div class="gift-step-panel" data-step-panel="1" hidden><h3 tabindex="-1">Сколько радости подарим?</h3><div id="gift-wheel-field"><p class="gift-panel-intro">Прокрутите колесо или укажите свою сумму.</p><output id="gift-live-amount" class="gift-live-amount" aria-live="polite"></output><div class="gift-wheel-wrap"><span class="gift-wheel-pointer" aria-hidden="true"></span><div id="gift-wheel" class="gift-wheel" role="listbox" tabindex="0" aria-label="Номинал от 1 000 до 50 000 рублей" aria-orientation="horizontal"></div></div><div class="gift-wheel-tools"><button type="button" id="gift-wheel-prev" aria-label="Уменьшить номинал">←</button><span>от 1 000 до 50 000 ₽</span><button type="button" id="gift-wheel-next" aria-label="Увеличить номинал">→</button></div><label for="gift-custom-amount" class="gift-label">Или своя сумма</label><div class="gift-custom-wrap"><input type="text" id="gift-custom-amount" inputmode="numeric" placeholder="Например, 2 600" maxlength="8" autocomplete="off" aria-describedby="gift-amount-hint gift-error"><span>₽</span></div><p id="gift-amount-hint" class="gift-field-hint">Любая целая сумма от 1 000 до 50 000 ₽.</p><p id="gift-error" class="gift-error" role="alert" hidden>Введите целую сумму от 1 000 до 50 000 ₽.</p></div><div id="gift-physical-amounts" hidden><p class="gift-panel-intro">Готовые карты на фирменной подложке.</p><div class="gift-amount-list" role="group" aria-label="Номиналы пластиковой карты">${[1500,3000,5000].map(n=>`<button type="button" data-gift-amount="${n}" aria-pressed="false">${M.money(n)}</button>`).join('')}</div><img class="gift-holder" src="assets/gifts/holder.png" alt="Фирменная подложка COYLI"></div></div>
 <div class="gift-step-panel" data-step-panel="2" hidden><h3 tabindex="-1">Добавьте немного личного.</h3><p class="gift-panel-intro">Пара тёплых слов сделает подарок вашим. Этот шаг можно пропустить.</p><div class="gift-name-fields"><label class="gift-label" for="gift-recipient">Кому<input id="gift-recipient" maxlength="40" placeholder="Имя получателя" autocomplete="off"></label><label class="gift-label" for="gift-sender">От кого<input id="gift-sender" maxlength="40" placeholder="Ваше имя" autocomplete="off"></label></div><div class="gift-wish-chips" role="group" aria-label="Идеи поздравлений"><button type="button" data-gift-wish="birthday">С днём рождения</button><button type="button" data-gift-wish="love">С любовью</button><button type="button" data-gift-wish="just">Просто так</button></div><label class="gift-label" for="gift-wish">Ваше поздравление <span>· по желанию</span></label><textarea id="gift-wish" maxlength="300" rows="4" placeholder="Напишите то, что хочется сказать…"></textarea><div class="gift-wish-footer"><button type="button" id="gift-clear-wish" class="gift-text-button">Убрать поздравление</button><span id="gift-wish-count">0 / 300</span></div></div>
 <div class="gift-flow-footer"><p id="gift-step-count"></p><div class="gift-flow-actions"><button type="button" id="gift-back" aria-label="Назад" hidden>←</button><button type="button" id="gift-next" class="gift-primary">Далее · сумма</button><button type="button" id="gift-order" class="gift-primary" hidden></button></div><p id="gift-delivery" class="gift-delivery"></p><p class="gift-footnote">Оформление и оплата через менеджера</p></div>
 <div id="gift-order-details" class="gift-order-details" hidden><h3 tabindex="-1">Подарок почти готов</h3><p>Проверьте заявку и отправьте её менеджеру. Он поможет с оплатой и оформлением карты.</p><label class="gift-sr-only" for="gift-order-text">Текст заявки</label><textarea id="gift-order-text" rows="9" readonly></textarea><div class="gift-order-actions"><button type="button" id="gift-copy">Скопировать</button><a id="gift-telegram" href="https://t.me/coyli_parfum" target="_blank" rel="noopener noreferrer">Открыть в Telegram ↗</a></div><p id="gift-copy-status" role="status" aria-live="polite"></p></div></div></div>`;
 r.querySelectorAll('[data-gift-format]').forEach(b=>b.addEventListener('click',()=>{
  clearTimeout(wheelTimer);state.format=b.dataset.giftFormat;
  if(state.format==='physical'){state.amount=plastic[state.amount]?state.amount:3000;state.step=1;}else{state.amount=electronicAmount;state.step=0;}
  updatePreview();updateStep();
 }));
 r.querySelectorAll('[data-gift-design]').forEach(b=>b.addEventListener('click',()=>selectDesign(b.dataset.giftDesign)));
 ['prev','next'].forEach((side,i)=>el('gift-design-'+side).addEventListener('click',()=>{const index=M.designs.indexOf(design());selectDesign(M.designs[(index+(i?1:-1)+M.designs.length)%M.designs.length].id);}));
 el('gift-show-all').addEventListener('click',e=>{const expanded=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(expanded));e.currentTarget.textContent=expanded?'Свернуть коллекцию':'Все дизайны';el('gift-design-gallery').classList.toggle('is-expanded',expanded);});
 r.querySelectorAll('[data-gift-step]').forEach(b=>b.addEventListener('click',()=>goStep(Number(b.dataset.giftStep))));
 el('gift-next').addEventListener('click',()=>goStep(state.step+1));el('gift-back').addEventListener('click',()=>goStep(state.step-1));
 r.querySelectorAll('[data-gift-amount]').forEach(b=>b.addEventListener('click',()=>{setAmount(Number(b.dataset.giftAmount));updateStep();}));
 el('gift-custom-amount').addEventListener('input',e=>{
  clearTimeout(wheelTimer);const raw=e.target.value,n=M.parseAmount(raw);setAmount(n);
  if(n!==null){customValue=n;buildWheel();}else{ignoreWheel=true;}
 });
 el('gift-custom-amount').addEventListener('blur',()=>amountError(!M.validAmount(state.amount)));
 const wheel=el('gift-wheel');
 wheel.addEventListener('scroll',()=>{cancelAnimationFrame(paintFrame);paintFrame=requestAnimationFrame(paintWheel);clearTimeout(wheelTimer);if(!ignoreWheel)wheelTimer=setTimeout(settleWheel,150);},{passive:true});
 wheel.addEventListener('wheel',e=>{if(state.step!==1)return;const change=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;if((change<0&&wheel.scrollLeft<=0)||(change>0&&wheel.scrollLeft>=wheel.scrollWidth-wheel.clientWidth-1))return;e.preventDefault();ignoreWheel=false;wheel.scrollLeft+=change;},{passive:false});
 wheel.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();ignoreWheel=false;if(e.key==='Home'||e.key==='End'){const n=e.key==='Home'?1000:50000;setAmount(n,true);centerWheel(n,true);}else moveWheel(e.key==='ArrowRight'?1:-1);});
 wheel.addEventListener('click',e=>{if(drag?.moved)return;const b=e.target.closest('[data-value]');if(b){ignoreWheel=false;const n=Number(b.dataset.value);setAmount(n,true);centerWheel(n,true);}});
 wheel.addEventListener('pointerdown',e=>{ignoreWheel=false;if(e.pointerType==='mouse'&&e.button===0){drag={id:e.pointerId,x:e.clientX,left:wheel.scrollLeft,moved:false};wheel.classList.add('is-dragging');}});
 wheel.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const diff=e.clientX-drag.x;if(Math.abs(diff)>4){drag.moved=true;wheel.setPointerCapture(e.pointerId);wheel.scrollLeft=drag.left-diff;}});
 const release=e=>{if(!drag)return;const moved=drag.moved;wheel.classList.remove('is-dragging');if(wheel.hasPointerCapture(e.pointerId))wheel.releasePointerCapture(e.pointerId);setTimeout(()=>{drag=null;if(moved)settleWheel();},0);};
 wheel.addEventListener('pointerup',release);wheel.addEventListener('pointercancel',release);
 el('gift-wheel-prev').addEventListener('click',()=>{ignoreWheel=false;moveWheel(-1);});el('gift-wheel-next').addEventListener('click',()=>{ignoreWheel=false;moveWheel(1);});
 new ResizeObserver(()=>{if(state.step===1&&state.format==='electronic')buildWheel();}).observe(wheel);
 el('gift-wish').addEventListener('input',e=>{state.wish=e.target.value;updateWish();});
 ['recipient','sender'].forEach(key=>el('gift-'+key).addEventListener('input',e=>{state[key]=e.target.value;updateWish();}));
 r.querySelectorAll('[data-gift-wish]').forEach(b=>b.addEventListener('click',()=>{state.wish=wishes[b.dataset.giftWish];el('gift-wish').value=state.wish;updateWish();}));
 el('gift-clear-wish').addEventListener('click',()=>{state.wish='';el('gift-wish').value='';updateWish();});
 el('gift-order').addEventListener('click',()=>{
  if(!M.validAmount(state.amount)){goStep(1);amountError(true);el('gift-custom-amount').focus();return;}
  if(state.format==='physical'&&window.CoyliApp?.request){window.CoyliApp.request({giftText:M.summary(state)},'pickup');return;}
  el('gift-order-text').value=M.summary(state);el('gift-telegram').href='https://t.me/coyli_parfum?text='+encodeURIComponent(M.summary(state));el('gift-order-details').hidden=false;el('gift-copy-status').textContent='';el('gift-order-details').querySelector('h3').focus({preventScroll:true});el('gift-order-details').scrollIntoView({behavior:'instant',block:'nearest'});
 });
 el('gift-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(M.summary(state));el('gift-copy-status').textContent='Заявка скопирована.';}catch{el('gift-order-text').focus();el('gift-order-text').select();el('gift-copy-status').textContent='Выделили заявку — скопируйте её вручную.';}});
 updatePreview();updateStep();
};
})();
