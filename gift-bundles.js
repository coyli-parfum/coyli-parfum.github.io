'use strict';
const comboDiscount=0.10;
const giftBundles=[
 {key:'body',name:'Мист и баттер',budget:1500,items:[{type:'Мисты',id:24,vol:60},{type:'Крем-баттер',id:4,vol:75}]},
 {key:'soft-evening',name:'Баттер и свеча',budget:2000,items:[{type:'Крем-баттер',id:4,vol:150},{type:'Свеча',id:40,vol:110}]},
 {key:'home-duo',name:'Диффузор и саше',budget:2000,items:[{type:'Диффузор',id:36,vol:50},{type:'Аромасаше',id:59,vol:75}]},
 {key:'on-the-go',name:'Аромат с собой',budget:2000,items:[{type:'perfume',id:149,vol:10,categories:['Люкс','Селектив']},{type:'Автопарфюм',id:72,vol:'1 шт'}]},
 {key:'home-trio',name:'Три аромата для дома и тела',budget:3000,items:[{type:'Диффузор',id:36,vol:50},{type:'Мисты',id:24,vol:60},{type:'Аромасаше',id:59,vol:75}]},
 {key:'perfume-care',name:'Парфюм, баттер и свеча',budget:3000,items:[{type:'perfume',id:107,vol:10,categories:['Люкс','Селектив']},{type:'Крем-баттер',id:4,vol:75},{type:'Свеча',id:40,vol:110}]},
 {key:'daily',name:'Для дома и для себя',budget:3000,items:[{type:'Рум-спрей',id:28,vol:100},{type:'Мисты',id:24,vol:60},{type:'Крем-баттер',id:4,vol:150}]},
 {key:'selective',name:'Селектив и уход',budget:5000,items:[{type:'perfume',id:107,vol:20,categories:['Селектив']},{type:'Рум-спрей',id:28,vol:100},{type:'Крем-баттер',id:4,vol:75}]},
 {key:'collection',name:'Большой ароматный набор',budget:5000,items:[{type:'Диффузор',id:36,vol:50},{type:'Аромасаше',id:59,vol:75},{type:'Крем-баттер',id:4,vol:150},{type:'Мисты',id:24,vol:60},{type:'Свеча',id:40,vol:110}]},
 {key:'original',name:'Оригинальный аромат и забота',budget:10000,items:[{type:'perfume',id:237,vol:20,categories:['Оригинал'],maxRegular:8000},{type:'Диффузор',id:36,vol:50},{type:'Крем-баттер',id:4,vol:150}]}
];
let bundleBudget=0;
const bundleChoices={};
const comboMoney=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽';
const comboCents=n=>Math.round(Number(n)*100);
function bundleByKey(key){return giftBundles.find(b=>b.key===key)}
function bundleSelections(b){return bundleChoices[b.key]||(bundleChoices[b.key]=b.items.map(x=>({...x})))}
function bundleProductUsable(x){return !!x&&!x.duplicateOf&&x.availability?.status!=='out_of_stock'&&!(Number(x.discountPercent)>0)}
function bundlePart(s){return {product:p.find(x=>x.id===Number(s.id)),vol:s.vol,type:s.type}}
function bundleParts(b){return bundleSelections(b).map(bundlePart)}
function bundleAmount(part){
 const x=part.product;if(!bundleProductUsable(x))return 0;
 if(part.type==='perfume'&&!['Люкс','Селектив','Оригинал'].includes(x.cat))return 0;
 const rates=part.type==='perfume'&&x.cat!=='Оригинал'?formatPrices(x,'spray'):x.price;
 if(part.type!=='perfume'&&x.cat!==part.type)return 0;
 if((part.type!=='perfume'||x.cat==='Оригинал')&&!x.volumes.some(v=>String(v)===String(part.vol)))return 0;
 const n=Number(rates[part.vol]);return Number.isFinite(n)&&n>0?n:0;
}
function bundleRegularTotal(b){return bundleParts(b).reduce((s,x)=>s+comboCents(bundleAmount(x)),0)/100}
function bundleTotal(b){return Math.round(comboCents(bundleRegularTotal(b))*(1-comboDiscount))/100}
function bundlePartAllowed(b,i,selection){
 const rule=b.items[i],x=p.find(x=>x.id===Number(selection.id));
 if(!rule||!bundleProductUsable(x)||selection.type!==rule.type||String(selection.vol)!==String(rule.vol))return false;
 if(rule.type==='perfume'&&!rule.categories.includes(x.cat))return false;
 if(rule.type!=='perfume'&&x.cat!==rule.type)return false;
 const amount=bundleAmount(bundlePart(selection));return amount>0&&(!rule.maxRegular||amount<=rule.maxRegular);
}
function bundleValid(b){return bundleSelections(b).every((s,i)=>bundlePartAllowed(b,i,s))&&bundleTotal(b)<=b.budget}
function bundleOptions(b,i){
 const current=bundleSelections(b)[i];
 const other=bundleParts(b).reduce((sum,part,j)=>sum+(i===j?0:comboCents(bundleAmount(part))),0);
 return p.map(x=>({...current,id:x.id})).filter(s=>bundlePartAllowed(b,i,s)&&Math.round((other+comboCents(bundleAmount(bundlePart(s))))*.9)<=b.budget*100).map(s=>({...s,product:p.find(x=>x.id===s.id)})).sort((a,b)=>a.product.name.localeCompare(b.product.name,'ru'));
}
function bundleDescription(part){return (part.product?.name||'Выберите аромат')+' · '+part.vol+(part.product?.cat==='Автопарфюм'?'':' мл')}
function comboPartType(part){return part.product?.cat==='Автопарфюм'?'Автопарфюм':part.type==='perfume'?part.product?.cat+' · спрей':part.type==='Мисты'?'Мист для тела':part.type}
function bundlePhotos(b){return '<div class="combo-scene">'+bundleParts(b).map(part=>'<div class="combo-object">'+(part.product?productPhoto(part.product,part.vol):'')+'</div>').join('')+'</div>'}
function comboPrice(b){return '<div class="combo-price"><del>'+comboMoney(bundleRegularTotal(b))+'</del><strong>'+comboMoney(bundleTotal(b))+'</strong><span>Выгода '+comboMoney((comboCents(bundleRegularTotal(b))-comboCents(bundleTotal(b)))/100)+'</span></div>'}
function renderBundles(){
 const root=document.getElementById('bundle-section');
 if(!catalogLoaded){root.innerHTML='<p role="status">Загружаем комбо…</p>';return}
 const list=giftBundles.filter(b=>!bundleBudget||b.budget===bundleBudget);
 root.innerHTML='<div class="combo-heading"><p class="coyli-kicker">КОМБО COYLI PARFUM</p><h2>Вместе выгоднее</h2><p>Выберите сочетание по бюджету. Меняйте ароматы — скидка 10% на полный набор сохранится.</p></div><div class="gift-budget-tabs" aria-label="Бюджет комбо">'+[0,1500,2000,3000,5000,10000].map(n=>'<button type="button" class="pill '+(n===bundleBudget?'selected':'')+'" data-combo-budget="'+n+'">'+(n?'До '+comboMoney(n):'Все комбо')+'</button>').join('')+'</div><div class="combo-grid">'+list.map(b=>'<article class="combo-card"><div class="combo-visual">'+bundlePhotos(b)+'<span class="combo-discount">−10%</span></div><div class="combo-content"><p class="combo-budget">До '+comboMoney(b.budget)+'</p><h3>'+esc(b.name)+'</h3><ul>'+bundleParts(b).map(part=>'<li><span>'+esc(comboPartType(part))+'</span><small>'+esc(bundleDescription(part))+'</small></li>').join('')+'</ul>'+comboPrice(b)+(b.key==='original'?'<p class="combo-location">Оригиналы — только ТК «Ньютон»</p>':'')+'<button type="button" class="primary" data-open-combo="'+b.key+'">Выбрать ароматы</button><p class="gift-pack-note">Фирменный пакет бесплатно</p></div></article>').join('')+'</div><p class="combo-terms">Скидка 10% действует при покупке полного набора. Акционные ароматы в комбо не участвуют. Наличие подтвердит менеджер.</p>';
 root.querySelectorAll('[data-combo-budget]').forEach(el=>el.onclick=()=>{bundleBudget=Number(el.dataset.comboBudget);renderBundles()});
 root.querySelectorAll('[data-open-combo]').forEach(el=>el.onclick=()=>openBundle(el.dataset.openCombo));
}
function bundleChoose(key,i,selection){const b=bundleByKey(key);if(!b||!bundlePartAllowed(b,i,selection))return false;const allowed=bundleOptions(b,i).some(x=>x.id===Number(selection.id));if(!allowed)return false;bundleSelections(b)[i]={...bundleSelections(b)[i],id:Number(selection.id)};return true}
function openBundle(key,keepScroll=false){
 const b=bundleByKey(key);if(!b)return;const panel=document.getElementById('panel'),scroll=keepScroll?panel.scrollTop:0;
 panel.innerHTML='<button class="close" onclick="hide()" aria-label="Закрыть комбо">×</button><p class="coyli-kicker">КОМБО · −10%</p><h2>'+esc(b.name)+'</h2>'+bundlePhotos(b)+'<p class="combo-detail-intro">Выберите аромат каждого средства. Объёмы и состав комбо фиксированы.</p>'+bundleParts(b).map((part,i)=>{
 const options=bundleOptions(b,i),selected=bundleSelections(b)[i];
 return '<section class="combo-part"><label for="combo-choice-'+i+'">'+esc(comboPartType(part))+' · '+part.vol+(part.product?.cat==='Автопарфюм'?'':' мл')+'</label>'+(part.type==='perfume'?'<input type="search" class="bundle-select" data-combo-search="'+i+'" placeholder="Найти аромат или бренд" aria-label="Поиск парфюма">':'')+'<select class="bundle-select" id="combo-choice-'+i+'" data-combo-choice="'+i+'">'+options.map(o=>'<option value="'+o.id+'" '+(o.id===selected.id?'selected':'')+'>'+esc((part.type==='perfume'?o.product.cat+' · ':'')+o.product.name)+' — '+comboMoney(bundleAmount(bundlePart(o)))+'</option>').join('')+'</select>'+(b.items[i].maxRegular?'<p class="muted">Оригинал 20 мл стоимостью до '+comboMoney(b.items[i].maxRegular)+' до скидки.</p>':'')+'</section>';
 }).join('')+comboPrice(b)+'<p class="gift-pack-note">Фирменный пакет бесплатно</p>'+(b.key==='original'?'<p class="combo-location">Оригиналы представлены только в ТК «Ньютон».</p>':'')+'<button class="primary" type="button" id="add-bundle" '+(!bundleValid(b)?'disabled':'')+'>Добавить комбо в корзину</button><p class="muted">Цена уже со скидкой 10%. Наличие подтвердит менеджер.</p>';
 panel.querySelectorAll('[data-combo-choice]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.comboChoice);if(bundleChoose(key,i,{...bundleSelections(b)[i],id:Number(el.value)})){openBundle(key,true);renderBundles()}});
 panel.querySelectorAll('[data-combo-search]').forEach(el=>el.oninput=()=>{const select=panel.querySelector('[data-combo-choice="'+el.dataset.comboSearch+'"]');for(const option of select.options){option.hidden=!norm(option.textContent).includes(norm(el.value))}});
 document.getElementById('add-bundle').onclick=()=>addBundleToCart(key);
 panel.scrollTop=scroll;document.getElementById('overlay').classList.add('open');
}
function bundleCartAmounts(b){
 const cents=bundleParts(b).map(part=>comboCents(bundleAmount(part))*.9),rounded=cents.map(Math.floor);
 let remainder=comboCents(bundleTotal(b))-rounded.reduce((a,v)=>a+v,0);
 const order=cents.map((v,i)=>({i,f:v-rounded[i]})).sort((a,b)=>b.f-a.f);
 for(let j=0;j<remainder;j++)rounded[order[j%order.length].i]++;
 return rounded.map(n=>n/100);
}
function addBundleToCart(key){
 const b=bundleByKey(key);if(!b||!catalogLoaded||!bundleValid(b))return false;
 const instance='combo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),amounts=bundleCartAmounts(b);
 bundleParts(b).forEach((part,i)=>cart.push({name:part.product.name,cat:part.product.cat,vol:String(part.vol),format:part.type==='perfume'?'Спрей':'',amount:amounts[i],regularAmount:bundleAmount(part),comboDiscount:10,bundle:b.name+' · −10%',bundleInstance:instance,bundleKey:b.key,packaging:'Фирменный пакет — бесплатно'}));
 saveCart();hide();showCart();return true;
}
