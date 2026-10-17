(()=>{
'use strict';
const designs=[
{id:'mom',label:'Маме',title:'Мам, это тебе.',line:'За всю твою заботу.',bg:'#e7edfc',ink:'#0047bb',mark:'♡'},
{id:'friend-her',label:'Подруге',title:'Ты — моя любовь.',line:'И у тебя отличный вкус.',bg:'#f5e6ed',ink:'#0047bb',mark:'♡'},
{id:'friend-him',label:'Другу',title:'Тебе идёт всё.',line:'Выбирай своё.',bg:'#e0edf3',ink:'#0047bb',mark:'↗'},
{id:'husband',label:'Мужу',title:'Ближе к тебе.',line:'Люблю, когда ты рядом.',bg:'#0047bb',ink:'#ffffff',mark:'∞'},
{id:'colleague',label:'Коллеге',title:'С вами приятно.',line:'Работать. Общаться. И просто быть.',bg:'#e9eaee',ink:'#0047bb',mark:'✳'},
{id:'anyone',label:'Для тебя',title:'Просто так.',line:'Потому что хочется порадовать.',bg:'#ece8f5',ink:'#0047bb',mark:'♡'}
];
const plastic={1500:'assets/gifts/card-heart.png',3000:'assets/gifts/card-bow.png',5000:'assets/gifts/card-gift.png'};
const state={format:'physical',amount:3000,design:'mom',wish:''};
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const root=()=>document.getElementById('gift-section');
const el=id=>root().querySelector('#'+id);
function summary(){const d=designs.find(x=>x.id===state.design);return 'Здравствуйте! Хочу оформить подарочную карту COYLI PARFUM.\n\nФормат: '+(state.format==='electronic'?'электронная':'пластиковая на фирменной подложке')+'\nСумма: '+money(state.amount)+(state.format==='electronic'?'\nДизайн: '+d.label+' — «'+d.title+'»'+(state.wish.trim()?'\nПожелание: '+state.wish.trim():''):'')+'\n\nПодскажите, пожалуйста, как оплатить и получить карту.';}
function update(){const electronic=state.format==='electronic',d=designs.find(x=>x.id===state.design);
root().querySelectorAll('[data-gift-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftFormat===state.format)));
root().querySelectorAll('[data-gift-amount]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.giftAmount)===state.amount)));
root().querySelectorAll('[data-gift-design]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.giftDesign===state.design)));
el('gift-electronic-preview').hidden=!electronic;el('gift-physical-preview').hidden=electronic;el('gift-designs').hidden=!electronic;el('gift-custom-field').hidden=!electronic;el('gift-wish-field').hidden=!electronic;
el('gift-electronic-preview').style.setProperty('--gift-background',d.bg);el('gift-electronic-preview').style.setProperty('--gift-ink',d.ink);
el('gift-card-title').textContent=d.title;el('gift-card-line').textContent=d.line;el('gift-card-mark').textContent=d.mark;el('gift-card-amount').textContent=state.amount>0?money(state.amount):'Ваша сумма';
el('gift-physical-image').src=plastic[state.amount]||plastic[3000];el('gift-physical-image').alt='Пластиковая подарочная карта COYLI PARFUM на '+money(state.amount);
el('gift-order').textContent=state.amount>0?'Оформить карту · '+money(state.amount):'Оформить карту';
el('gift-delivery').textContent=electronic?'После оплаты менеджер отправит карту вам. Перешлите её тому, кого хочется порадовать.':'Подарочную карту можно оформить с доставкой или забрать в любом из наших филиалов.';
el('gift-order-details').hidden=true;el('gift-error').hidden=true;
}
window.renderGiftSection=function(){const r=root();if(!r||r.dataset.ready)return;r.dataset.ready='true';
r.innerHTML=`<div class="gift-heading"><p class="gift-eyebrow">ПОДАРОЧНЫЕ КАРТЫ</p><h2>Подарочная карта COYLI PARFUM</h2><p>Когда хочется подарить возможность выбрать своё.</p></div>
<div class="gift-layout"><div class="gift-preview-col"><div class="gift-electronic-card" id="gift-electronic-preview"><div class="gift-card-top"><span>ПОДАРОЧНАЯ КАРТА</span><span class="gift-brand">COYLI</span></div><span id="gift-card-mark" aria-hidden="true"></span><div class="gift-card-copy"><h3 id="gift-card-title"></h3><p id="gift-card-line"></p></div><div class="gift-card-bottom"><strong id="gift-card-amount" aria-live="polite"></strong><span>PARFUM · HOME · BODY</span></div></div>
<div id="gift-physical-preview" hidden><div class="gift-physical-main"><img id="gift-physical-image" src="assets/gifts/card-bow.png" alt="Подарочная карта"></div><div class="gift-holder"><img src="assets/gifts/holder.png" alt="Подарочная карта COYLI на фирменной синей подложке"><p>Фирменная подложка<br>для вашего подарка.</p></div></div></div>
<div class="gift-controls">
<div id="gift-designs"><p class="gift-label">Кому дарим?</p><div class="gift-design-list">${designs.map(d=>'<button type="button" data-gift-design="'+d.id+'" aria-pressed="false">'+d.label+'</button>').join('')}</div></div>
<p class="gift-label">Выберите номинал</p><div class="gift-amount-list">${[1500,3000,5000].map(n=>'<button type="button" data-gift-amount="'+n+'" aria-pressed="false">'+money(n)+'</button>').join('')}</div>
<div id="gift-custom-field"><label class="gift-sr-only" for="gift-custom-amount">Своя сумма в рублях</label><div class="gift-custom-wrap"><input type="text" id="gift-custom-amount" inputmode="numeric" placeholder="Своя сумма" maxlength="7" autocomplete="off"><span>₽</span></div></div>
<div id="gift-wish-field"><label class="gift-label" for="gift-wish">Пара слов от вас <span>· по желанию</span></label><textarea id="gift-wish" maxlength="300" rows="3" placeholder="Напишите то, что хочется сказать."></textarea></div>
<p id="gift-delivery" class="gift-delivery"></p><p id="gift-error" class="gift-error" role="alert" hidden>Укажите сумму в рублях — целое число больше нуля.</p><button type="button" id="gift-order" class="gift-primary"></button><p class="gift-footnote">Оформление и оплата через менеджера</p>
<div id="gift-order-details" class="gift-order-details" hidden><label class="gift-label" for="gift-order-text">Ваша заявка</label><textarea id="gift-order-text" rows="8" readonly></textarea><p>Скопируйте заявку и отправьте её менеджеру в Telegram.</p><div class="gift-order-actions"><button type="button" id="gift-copy">Скопировать</button><a href="https://t.me/Jullyheyy" target="_blank" rel="noopener noreferrer">Открыть Telegram</a></div><p id="gift-copy-status" role="status" aria-live="polite"></p></div></div></div>`;
r.querySelectorAll('[data-gift-format]').forEach(b=>b.addEventListener('click',()=>{state.format=b.dataset.giftFormat;if(state.format==='physical'&&!(state.amount in plastic)){state.amount=3000;el('gift-custom-amount').value='';}update();}));
r.querySelectorAll('[data-gift-design]').forEach(b=>b.addEventListener('click',()=>{state.design=b.dataset.giftDesign;update();}));
r.querySelectorAll('[data-gift-amount]').forEach(b=>b.addEventListener('click',()=>{state.amount=Number(b.dataset.giftAmount);el('gift-custom-amount').value='';update();}));
el('gift-custom-amount').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^0-9]/g,'');state.amount=Number(e.target.value);update();});
el('gift-wish').addEventListener('input',e=>{state.wish=e.target.value;el('gift-order-details').hidden=true;});
el('gift-order').addEventListener('click',()=>{if(!Number.isSafeInteger(state.amount)||state.amount<=0){el('gift-error').hidden=false;el('gift-custom-amount').focus();return;}el('gift-order-text').value=summary();el('gift-order-details').hidden=false;el('gift-copy-status').textContent='';el('gift-order-details').scrollIntoView({behavior:'smooth',block:'nearest'});});
el('gift-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary());el('gift-copy-status').textContent='Заявка скопирована.';}catch{el('gift-order-text').focus();el('gift-order-text').select();el('gift-copy-status').textContent='Выделили заявку — скопируйте её вручную.';}});
update();};
})();
