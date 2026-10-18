'use strict';
const giftBundles = [
 {key:'little',name:'Небольшой знак внимания',caption:'Баттер + миниатюра парфюма',budget:1000,items:[{type:'Крем-баттер',id:4,vol:75},{type:'perfume',id:435,vol:5,format:'spray'}]},
 {key:'body',name:'Для тела',caption:'Баттер + мист',budget:2000,items:[{type:'Крем-баттер',id:4,vol:75},{type:'Мисты',id:24,vol:60}]},
 {key:'evening',name:'Домашний вечер',caption:'Баттер + мист + свеча',budget:3000,items:[{type:'Крем-баттер',id:4,vol:75},{type:'Мисты',id:24,vol:60},{type:'Свеча',id:40,vol:110}]},
 {key:'signature',name:'Парфюм и уход',caption:'Баттер + мист + селективный парфюм',budget:4000,items:[{type:'Крем-баттер',id:4,vol:150},{type:'Мисты',id:24,vol:60},{type:'perfume',id:446,vol:10,format:'spray'}]},
 {key:'special',name:'Особенный подарок',caption:'Баттер + мист + оригинальный парфюм',budget:5000,items:[{type:'Крем-баттер',id:4,vol:150},{type:'Мисты',id:24,vol:60},{type:'perfume',id:189,vol:10,format:'original'}]}
];
let bundleBudget=0;
const bundleChoices={};
const giftBagPath='assets/gifts/coyli-bag-20261018.jpeg';
const giftPerfumeCategories=['Люкс','Селектив','Оригинал'];
function bundleByKey(key){return giftBundles.find(b=>b.key===key)}
function bundleSelections(bundle){
 if(!bundleChoices[bundle.key])bundleChoices[bundle.key]=bundle.items.map(i=>({...i}));
 return bundleChoices[bundle.key];
}
function bundleProductUsable(x){return !!x&&!x.duplicateOf&&x.availability?.status!=='out_of_stock'}
function bundlePart(selection){
 const product=p.find(x=>x.id===Number(selection.id));
 return {product,vol:Number(selection.vol),format:selection.format||'',type:selection.type};
}
function bundleParts(bundle){return bundleSelections(bundle).map(bundlePart)}
function bundleAmount(part){
 const x=part.product;if(!bundleProductUsable(x))return 0;if(part.type==='perfume'&&(Number(part.vol)<5||(x.cat==='Оригинал'?part.format!=='original':part.format!=='spray')))return 0;
 let regular;
 if(part.type==='perfume'&&['Люкс','Селектив'].includes(x.cat)){
  if(part.format!=='spray')return 0;
  regular=formatPrices(x,part.format)[part.vol];
 }else{
  if(!x.volumes.includes(Number(part.vol)))return 0;
  regular=x.price[part.vol];
 }
 const amount=saleAmount(x,regular);return Number.isFinite(Number(amount))&&Number(amount)>0?Number(amount):0;
}
function bundleTotal(bundle){return bundleParts(bundle).reduce((sum,part)=>sum+bundleAmount(part),0)}
function bundleValid(bundle){return bundleParts(bundle).every(part=>bundleAmount(part)>0)&&bundleTotal(bundle)<=bundle.budget}
function bundleAllowance(bundle,index){return Math.max(0,bundle.budget-bundleParts(bundle).reduce((sum,part,i)=>sum+(i===index?0:bundleAmount(part)),0))}
function bundlePerfumeOptions(bundle,index,category,formatValue){
 const allowance=bundleAllowance(bundle,index);const options=[];
 for(const x of p){
  if(!bundleProductUsable(x)||!giftPerfumeCategories.includes(x.cat)||(category&&x.cat!==category))continue;
  const formats=x.cat==='Оригинал'?['original']:['spray'];
  for(const fmt of formats){
   if(formatValue&&fmt!==formatValue)continue;
   const volumes=fmt==='original'?x.volumes:Object.keys(formatPrices(x,fmt)).map(Number);
   for(const vol of volumes){
    if(Number(vol)<5)continue;
    const selection={type:'perfume',id:x.id,vol:Number(vol),format:fmt};
    const amount=bundleAmount(bundlePart(selection));
    if(amount>0&&amount<=allowance)options.push({...selection,amount,product:x});
   }
  }
 }
 return options.sort((a,b)=>a.product.name.localeCompare(b.product.name,'ru')||a.amount-b.amount);
}
function bundleHomeOptions(bundle,index){
 const selected=bundleSelections(bundle)[index],allowance=bundleAllowance(bundle,index);
 return p.filter(x=>bundleProductUsable(x)&&x.cat===selected.type&&x.volumes.includes(Number(selected.vol)))
 .map(x=>({type:selected.type,id:x.id,vol:selected.vol,amount:bundleAmount(bundlePart({...selected,id:x.id})),product:x}))
 .filter(x=>x.amount>0&&x.amount<=allowance).sort((a,b)=>a.product.name.localeCompare(b.product.name,'ru'));
}
function bundleFormatName(part){return part.type==='perfume'?(part.product?.cat==='Оригинал'?'Оригинал':part.product?.cat+' · '+'спрей'):part.product?.cat||part.type}
function bundleDescription(part){return (part.product?.name||'Уточняется')+' · '+part.vol+' мл'}
function bundlePhotos(bundle){
 const parts=bundleParts(bundle);
 return '<div class="gift-scene"><img class="gift-scene-bag" src="'+giftBagPath+'" alt="Бесплатный фирменный пакет COYLI PARFUM" loading="lazy"><div class="gift-scene-products">'+parts.map(part=>'<div class="gift-scene-product">'+(part.product?productPhoto(part.product,part.vol):'')+'</div>').join('')+'</div></div>';
}
function renderBundles(){
 const root=document.getElementById('bundle-section');
 if(!catalogLoaded){root.innerHTML='<p role="status">Загружаем подарки…</p>';return;}
 const list=giftBundles.filter(b=>!bundleBudget||bundleTotal(b)<=bundleBudget);
 root.innerHTML='<div class="bundle-heading"><span class="coyli-kicker">ПОДАРКИ COYLI</span><h2>Уже придумали за вас</h2><p>Выберите подарок по бюджету. Возьмите готовое сочетание или замените ароматы на свои.</p></div><div class="gift-budget-tabs" aria-label="Бюджет подарка">'+[0,1000,2000,3000,4000,5000].map(n=>'<button type="button" class="pill '+(n===bundleBudget?'selected':'')+'" data-bundle-budget="'+n+'" aria-pressed="'+(n===bundleBudget)+'">'+(n?'До '+rub(n):'Все подарки')+'</button>').join('')+'</div><div class="bundle-grid">'+list.map(b=>{
  const parts=bundleParts(b),valid=bundleValid(b);
  return '<article class="bundle-card"><div class="bundle-photos">'+bundlePhotos(b)+'<span class="bundle-budget">До '+rub(b.budget)+'</span></div><div class="bundle-card-content"><h3>'+esc(b.name)+'</h3><p class="bundle-composition">'+parts.map(part=>esc(part.type==='perfume'?bundleFormatName(part)+' '+part.vol+' мл':part.product?.cat+' '+part.vol+' мл')).join(' + ')+'</p><ul class="bundle-card-items">'+parts.map(part=>'<li>'+esc(bundleDescription(part))+'</li>').join('')+'</ul><p class="gift-pack-note">Фирменный пакет в комплекте · бесплатно</p><div class="bundle-card-bottom"><strong>'+rub(bundleTotal(b))+'</strong><button type="button" class="primary" data-add-bundle="'+b.key+'" '+(!valid?'disabled':'')+'>Добавить подарок</button><button type="button" class="bundle-customize" data-open-bundle="'+b.key+'">Посмотреть / заменить ароматы →</button></div>'+(!valid?'<p class="muted">Состав требует уточнения. Откройте подарок и выберите замену.</p>':'')+'</div></article>';
 }).join('')+'</div><p class="muted bundle-note">Цена — сумма выбранных товаров. Наличие подтвердит менеджер. Парфюм входит в объёме, указанном в составе.</p><div id="bundle-toast" class="bundle-toast" role="status" aria-live="polite"></div>';
 root.querySelectorAll('[data-bundle-budget]').forEach(el=>el.onclick=()=>{bundleBudget=Number(el.dataset.bundleBudget);renderBundles()});
 root.querySelectorAll('[data-open-bundle]').forEach(el=>el.onclick=()=>openBundle(el.dataset.openBundle));
 root.querySelectorAll('[data-add-bundle]').forEach(el=>el.onclick=()=>addBundleToCart(el.dataset.addBundle));
}
function bundleChoose(key,index,selection){
 const b=bundleByKey(key);if(!b||!Number.isInteger(index)||!b.items[index])return false;
 const candidate=bundlePart(selection),current=bundleSelections(b)[index];
 if(selection.type!==current.type||!bundleProductUsable(candidate.product))return false;
 if(selection.type!=='perfume'&&(candidate.product.cat!==current.type||Number(selection.vol)!==Number(current.vol)))return false;
 if(selection.type==='perfume'&&!giftPerfumeCategories.includes(candidate.product.cat))return false;
 const amount=bundleAmount(candidate);if(!(amount>0)||amount>bundleAllowance(b,index))return false;
 bundleSelections(b)[index]={type:selection.type,id:Number(selection.id),vol:Number(selection.vol),...(selection.format?{format:selection.format}:{})};
 return true;
}
function preferredBundleOption(options,selection){
 return options.find(o=>o.id===selection.id&&o.vol===selection.vol&&o.format===selection.format)||options.find(o=>o.id===selection.id&&o.vol===selection.vol)||options.find(o=>o.vol===selection.vol&&o.format===selection.format)||options.find(o=>o.vol===selection.vol)||options[0];
}
function openBundle(key,keepScroll=false){
 const b=bundleByKey(key);if(!b)return;
 const panel=document.getElementById('panel'),oldScroll=keepScroll?panel.scrollTop:0;
 const parts=bundleParts(b),valid=bundleValid(b);
 panel.innerHTML='<button class="close" onclick="hide()" aria-label="Закрыть подарок">×</button><p class="muted">ПОДАРОК ДО '+rub(b.budget)+'</p><h2>'+esc(b.name)+'</h2><div class="bundle-photos bundle-detail-photo">'+bundlePhotos(b)+'</div><p class="gift-pack-note">Фирменный пакет в комплекте · бесплатно</p><p class="bundle-detail-hint">Готовое сочетание уже выбрано. Каждый аромат можно заменить отдельно.</p>'+parts.map((part,index)=>{
  const selected=bundleSelections(b)[index],perfume=part.type==='perfume';
  let control;
  if(perfume){
   const categories=giftPerfumeCategories.map(c=>'<option value="'+c+'" '+(part.product?.cat===c?'selected':'')+' '+(!bundlePerfumeOptions(b,index,c).length?'disabled':'')+'>'+c+(!bundlePerfumeOptions(b,index,c).length?' — вне бюджета':'')+'</option>').join('');
   const formats=(part.product?.cat==='Оригинал'?['original']:['spray']).filter(f=>bundlePerfumeOptions(b,index,part.product?.cat,f).length);
   const options=bundlePerfumeOptions(b,index,part.product?.cat,selected.format),products=[...new Map(options.map(o=>[o.id,o.product])).values()];
   const volumes=options.filter(o=>o.id===selected.id);
   control='<label class="bundle-label" for="gift-category-'+index+'">Категория парфюма</label><select class="bundle-select" id="gift-category-'+index+'" data-gift-category="'+index+'">'+categories+'</select><label class="bundle-label" for="gift-format-'+index+'">Формат</label><select class="bundle-select" id="gift-format-'+index+'" data-gift-format="'+index+'">'+formats.map(f=>'<option value="'+f+'" '+(f===selected.format?'selected':'')+'>'+('Спрей')+'</option>').join('')+'</select><label class="bundle-label" for="gift-perfume-search-'+index+'">Найти аромат</label><input class="bundle-select" type="search" id="gift-perfume-search-'+index+'" data-gift-perfume-search="'+index+'" placeholder="Название аромата или бренда" autocomplete="off"><label class="bundle-label" for="gift-perfume-'+index+'">Аромат парфюма</label><select class="bundle-select" id="gift-perfume-'+index+'" data-gift-perfume="'+index+'">'+products.map(x=>'<option value="'+x.id+'" '+(x.id===selected.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select><span class="muted" id="gift-search-count-'+index+'"></span><label class="bundle-label" for="gift-volume-'+index+'">Объём</label><select class="bundle-select" id="gift-volume-'+index+'" data-gift-volume="'+index+'">'+volumes.map(o=>'<option value="'+o.vol+'" '+(o.vol===selected.vol?'selected':'')+'>'+o.vol+' мл · '+rub(o.amount)+'</option>').join('')+'</select><p class="muted">Доступны варианты, с которыми подарок остаётся в бюджете '+rub(b.budget)+'.</p>';
  }else{
   const options=bundleHomeOptions(b,index);
   control='<label class="bundle-label" for="gift-home-'+index+'">Аромат · '+part.vol+' мл</label><select id="gift-home-'+index+'" class="bundle-select" data-gift-home="'+index+'">'+options.map(o=>'<option value="'+o.id+'" '+(o.id===selected.id?'selected':'')+'>'+esc(o.product.name)+' · '+rub(o.amount)+'</option>').join('')+'</select>';
  }
  return '<section class="gift-part"><div class="gift-part-summary"><div class="gift-part-thumb">'+(part.product?productPhoto(part.product,part.vol):'')+'</div><div><span class="muted">'+esc(bundleFormatName(part))+'</span><h3>'+esc(bundleDescription(part))+'</h3><span>'+rub(bundleAmount(part))+'</span></div></div><details class="gift-replacements" data-gift-detail="'+index+'"><summary>Заменить аромат</summary>'+control+'</details></section>';
 }).join('')+'<div class="gift-detail-total"><span>Итого с упаковкой</span><strong>'+rub(bundleTotal(b))+'</strong></div><button type="button" class="primary" id="add-bundle" '+(!valid?'disabled':'')+'>Добавить подарок в корзину</button><p class="muted">Наличие подтвердит менеджер в Telegram.</p>';
 const redraw=index=>{openBundle(key,true);const d=panel.querySelector('[data-gift-detail="'+index+'"]');if(d)d.open=true;renderBundles()};
 panel.querySelectorAll('[data-gift-home]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.giftHome),selection={...bundleSelections(b)[i],id:Number(el.value)};if(bundleChoose(key,i,selection))redraw(i)});
 panel.querySelectorAll('[data-gift-category]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.giftCategory),option=preferredBundleOption(bundlePerfumeOptions(b,i,el.value),bundleSelections(b)[i]);if(option&&bundleChoose(key,i,option))redraw(i)});
 panel.querySelectorAll('[data-gift-format]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.giftFormat),current=bundleSelections(b)[i],category=p.find(x=>x.id===current.id)?.cat,option=preferredBundleOption(bundlePerfumeOptions(b,i,category,el.value),current);if(option&&bundleChoose(key,i,option))redraw(i)});
 panel.querySelectorAll('[data-gift-perfume]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.giftPerfume),current=bundleSelections(b)[i],category=p.find(x=>x.id===current.id)?.cat,options=bundlePerfumeOptions(b,i,category,current.format).filter(o=>o.id===Number(el.value)),option=preferredBundleOption(options,current);if(option&&bundleChoose(key,i,option))redraw(i)});
 panel.querySelectorAll('[data-gift-volume]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.giftVolume),current=bundleSelections(b)[i];if(bundleChoose(key,i,{...current,vol:Number(el.value)}))redraw(i)});
 panel.querySelectorAll('[data-gift-perfume-search]').forEach(el=>el.oninput=()=>{
  const i=Number(el.dataset.giftPerfumeSearch),current=bundleSelections(b)[i],category=p.find(x=>x.id===current.id)?.cat,options=bundlePerfumeOptions(b,i,category,current.format),allProducts=[...new Map(options.map(o=>[o.id,o.product])).values()],matches=allProducts.filter(x=>norm(x.name).includes(norm(el.value))),select=document.getElementById('gift-perfume-'+i);
  select.innerHTML='<option value="">'+(matches.length?'Выберите аромат':'Ничего не найдено')+'</option>'+matches.map(x=>'<option value="'+x.id+'" '+(x.id===current.id?'selected':'')+'>'+esc(x.name)+'</option>').join('');
  document.getElementById('gift-search-count-'+i).textContent='Найдено: '+matches.length;
 });
 document.getElementById('add-bundle').onclick=()=>addBundleToCart(key);
 panel.scrollTop=oldScroll;document.getElementById('overlay').classList.add('open');
}
function addBundleToCart(key){
 const b=bundleByKey(key);if(!b||!catalogLoaded||!bundleValid(b))return false;
 const instance='gift-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 for(const part of bundleParts(b))cart.push({name:part.product.name,cat:part.product.cat,vol:String(part.vol),format:part.type==='perfume'?(part.format==='original'?'Оригинал · спрей':'Спрей'):'',amount:bundleAmount(part),bundle:b.name,bundleInstance:instance,bundleKey:b.key,packaging:'Фирменный пакет — бесплатно'});
 saveCart();hide();showCart();return true;
}

