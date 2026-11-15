/* Approved artwork. A request is not an issued or paid certificate. */
(()=>{
'use strict';
const M=window.CoyliGiftCards;
const state={format:'electronic',amount:3000,design:'hug',wish:''};
const plastic={1500:'assets/gifts/card-heart.png',3000:'assets/gifts/card-bow.png',5000:'assets/gifts/card-gift.png'};
const root=()=>document.getElementById('gift-section');
const el=id=>root().querySelector('#'+id);
const design=()=>M.designs.find(d=>d.id===state.design);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function preview(d,amount,thumb=false){
 const value=M.validAmount(amount)?M.money(amount):'Ваша сумма';
 const size=Math.min(d.size,d.size*7/value.replace(/\s/g,'').length);
 return `<span class="gift-artwork"><img ${thumb?'loading="lazy"':''} src="${d.image}" alt="${thumb?'':esc(d.label)}" width="1600" height="1000" decoding="async"><svg class="gift-amount-layer gift-amount-${d.tone||'blue'}" viewBox="0 0 1600 1000" aria-hidden="true"><text x="${d.x}" y="${d.y}" style="font-size:${size}px">${esc(value)}</text></svg></span>`;
}
const summary=()=>M.summary(state);
function update(){
 const electronic=state.format==='electronic',d=design();
 root().querySelectorAll('[data-gift-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftFormat===state.format)));
 root().querySelectorAll('[data-gift-amount]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.giftAmount)===state.amount)));
 root().querySelectorAll('[data-gift-design]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftDesign===state.design)));
 el('gift-electronic-preview').hidden=!electronic;el('gift-physical-preview').hidden=electronic;
 el('gift-designs').hidden=!electronic;el('gift-custom-field').hidden=!electronic;el('gift-wish-field').hidden=!electronic;
 el('gift-electronic-preview').innerHTML=preview(d,state.amount);
 el('gift-preview-caption').textContent=electronic?'Дизайн «'+d.label+'» · '+(M.validAmount(state.amount)?M.money(state.amount):'выберите сумму'):'Пластиковая карта · '+M.money(state.amount);
 el('gift-physical-image').src=plastic[state.amount]||plastic[3000];
 el('gift-physical-image').alt='Пластиковая подарочная карта COYLI PARFUM на '+M.money(state.amount);
 el('gift-order').textContent=M.validAmount(state.amount)?'Оформить · '+M.money(state.amount):'Оформить сертификат';
 el('gift-delivery').textContent=electronic?'После оплаты менеджер отправит электронную карту вам. Её можно переслать получателю.':'Подарочную карту можно оформить с доставкой или забрать в любом из наших филиалов.';
 el('gift-order-details').hidden=true;el('gift-error').hidden=true;el('gift-custom-amount').removeAttribute('aria-invalid');
}
window.renderGiftSection=function(){
 const r=root();if(!r||r.dataset.ready)return;r.dataset.ready='true';
 r.innerHTML=`<div class="gift-heading"><p class="gift-eyebrow">ПОДАРОЧНЫЕ КАРТЫ</p><h2>Подарите свой знак внимания</h2><p>Выберите настроение и сумму. Аромат — за тем, кому дарите.</p></div>
 <div class="gift-layout"><div class="gift-preview-col"><div id="gift-electronic-preview"></div>
 <div id="gift-physical-preview" hidden><div class="gift-physical-main"><img id="gift-physical-image" src="assets/gifts/card-bow.png" alt="Подарочная карта"></div><div class="gift-holder"><img src="assets/gifts/holder.png" alt="Подарочная карта COYLI на фирменной синей подложке"><p>Фирменная подложка<br>для вашего подарка.</p></div></div>
 <p class="gift-preview-caption" id="gift-preview-caption" aria-live="polite"></p><p class="gift-preview-note">Предпросмотр. Номер карты присваивается при оформлении.</p></div>
 <div class="gift-controls"><div class="gift-format" role="group" aria-label="Формат подарочной карты"><button type="button" data-gift-format="electronic" aria-pressed="true">Электронная</button><button type="button" data-gift-format="physical" aria-pressed="false">Пластиковая</button></div>
 <div id="gift-designs"><p class="gift-label">Выберите дизайн</p><div class="gift-design-gallery" role="group" aria-label="Дизайны подарочных карт">${M.designs.map(d=>`<button type="button" data-gift-design="${d.id}" aria-pressed="false">${preview(d,3000,true)}<span class="gift-design-name">${esc(d.label)}</span></button>`).join('')}</div></div>
 <p class="gift-label">Выберите номинал</p><div class="gift-amount-list" role="group" aria-label="Номинал карты">${[1500,3000,5000].map(n=>`<button type="button" data-gift-amount="${n}" aria-pressed="false">${M.money(n)}</button>`).join('')}</div>
 <div id="gift-custom-field"><label class="gift-sr-only" for="gift-custom-amount">Своя сумма в рублях</label><div class="gift-custom-wrap"><input type="text" id="gift-custom-amount" inputmode="numeric" placeholder="Или своя сумма" maxlength="12" autocomplete="off" aria-describedby="gift-error"><span>₽</span></div></div>
 <div id="gift-wish-field"><label class="gift-label" for="gift-wish">Поздравление <span>· по желанию</span></label><textarea id="gift-wish" maxlength="300" rows="3" placeholder="Пара тёплых слов от вас"></textarea></div>
 <p id="gift-delivery" class="gift-delivery"></p><p id="gift-error" class="gift-error" role="alert" hidden>Укажите сумму в рублях — целое число больше нуля.</p><button type="button" id="gift-order" class="gift-primary"></button><p class="gift-footnote">Оформление и оплата через менеджера</p>
 <div id="gift-order-details" class="gift-order-details" hidden><label class="gift-label" for="gift-order-text">Ваша заявка</label><textarea id="gift-order-text" rows="9" readonly></textarea><p>Проверьте сообщение и отправьте его менеджеру в Telegram.</p><div class="gift-order-actions"><button type="button" id="gift-copy">Скопировать</button><a id="gift-telegram" href="https://t.me/coyli_parfum" target="_blank" rel="noopener noreferrer">Открыть в Telegram</a></div><p id="gift-copy-status" role="status" aria-live="polite"></p></div></div></div>`;
 r.querySelectorAll('[data-gift-format]').forEach(b=>b.addEventListener('click',()=>{state.format=b.dataset.giftFormat;if(state.format==='physical'&&!(state.amount in plastic)){state.amount=3000;el('gift-custom-amount').value='';}update();}));
 r.querySelectorAll('[data-gift-design]').forEach(b=>b.addEventListener('click',()=>{state.design=b.dataset.giftDesign;update();}));
 r.querySelectorAll('[data-gift-amount]').forEach(b=>b.addEventListener('click',()=>{state.amount=Number(b.dataset.giftAmount);el('gift-custom-amount').value='';update();}));
 el('gift-custom-amount').addEventListener('input',e=>{state.amount=M.parseAmount(e.target.value);update();});
 el('gift-wish').addEventListener('input',e=>{state.wish=e.target.value;el('gift-order-details').hidden=true;});
 el('gift-order').addEventListener('click',()=>{
  if(!M.validAmount(state.amount)){el('gift-error').hidden=false;el('gift-custom-amount').setAttribute('aria-invalid','true');el('gift-custom-amount').focus();return;}
  if(state.format==='physical'&&window.CoyliApp?.request){window.CoyliApp.request({giftText:summary()},'pickup',()=>{hide();selectCategory('Подарочные карты');});return;}
  el('gift-order-text').value=summary();el('gift-telegram').href='https://t.me/coyli_parfum?text='+encodeURIComponent(summary());el('gift-order-details').hidden=false;el('gift-copy-status').textContent='';el('gift-order-details').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 el('gift-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary());el('gift-copy-status').textContent='Заявка скопирована.';}catch{el('gift-order-text').focus();el('gift-order-text').select();el('gift-copy-status').textContent='Выделили заявку — скопируйте её вручную.';}});
 update();
};
})();
