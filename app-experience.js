/* Uses the existing catalogue and price functions; cart storage stays backwards compatible. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const paths = {
    home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    catalog:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
    bag:'M5 7h14l1 14H4ZM8 8V6a4 4 0 0 1 8 0v2',
    more:'M4 5h16M4 12h16M4 19h16',
    close:'m6 6 12 12M6 18 18 6', back:'m14 5-7 7 7 7',
    next:'m9 5 7 7-7 7', down:'m6 9 6 6 6-6',
    search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    check:'m5 12 4 4L19 6', trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'
  };
  const icon = name => `<svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.next}"/></svg>`;
  const label = c => ({'Все товары':'Все товары','Оригинал':'Оригиналы','Крем-баттер':'Крем-баттеры','Подарочные карты':'Сертификаты','Свеча':'Свечи','Диффузор':'Диффузоры'}[c] || c);
  const unit = x => `${x.vol}${/[^\d.,\s]/.test(String(x.vol)) ? '' : x.cat === 'Аромасаше' ? ' г' : ' мл'}`;
  const amountTotal = () => cart.reduce((s,x) => s + Number(x.amount),0);
  const money = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n) + ' ₽';
  const originalRender = render, originalSaveCart = saveCart, originalSelectCategory = selectCategory;
  const originalRoute = applyCatalogRoute;
  let screen = '', restoreFocus = null, modalReturnHash = '', toastTimer, undoCart = null;
  let draft = {method:'pickup',branch:'',city:'',name:'',comment:''};
  let installPrompt = null;

  const nav = document.createElement('nav');
  nav.className = 'app-nav'; nav.setAttribute('aria-label','Основная навигация');
  nav.innerHTML = [['home','Главная'],['catalog','Каталог'],['bag','Корзина'],['more','Ещё']].map(([id,title]) => `<button type="button" data-app-nav="${id}">${icon(id)}<span>${title}</span>${id==='bag'?'<span class="app-nav-badge" id="app-cart-count" hidden></span>':''}</button>`).join('');
  document.body.appendChild(nav);
  const toast = document.createElement('div'); toast.className='app-toast'; toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); document.body.appendChild(toast);
  const tools = document.createElement('div'); tools.className='app-catalog-tools'; tools.id='app-catalog-tools';
  tools.innerHTML=`<button class="app-category-trigger" type="button" id="app-categories">${icon('catalog')}<span>Все разделы</span></button><button type="button" class="app-reset-search" id="app-reset-search" hidden>Сбросить поиск</button>`;
  $('search').before(tools); $('search').setAttribute('aria-label','Поиск по названию, бренду или нотам'); $('search').setAttribute('type','search'); $('search').setAttribute('enterkeyhint','search');
  const searchButton=document.createElement('button'); searchButton.type='button'; searchButton.className='app-search-button'; searchButton.setAttribute('aria-label','Найти аромат'); searchButton.innerHTML=icon('search'); document.querySelector('header .bag').before(searchButton);
  searchButton.onclick=()=>{selectCategory('Все товары');$('search').focus({preventScroll:true});$('search').scrollIntoView({block:'center'});};
  document.querySelector('.brand-link').onclick=e=>{e.preventDefault();goHome();};
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{const target=b.dataset.appNav;if(target==='home')goHome();else if(target==='catalog')showCategories();else if(target==='bag')showCart();else showMore();});
  $('app-categories').onclick=showCategories;
  $('app-reset-search').onclick=()=>{query='';$('search').value='';render();$('search').focus({preventScroll:true});};

  function notify(text,action,fn){
    clearTimeout(toastTimer);toast.innerHTML=`<span>${esc(text)}</span>${action?`<button type="button">${esc(action)}</button>`:''}`;
    if(action)toast.querySelector('button').onclick=()=>{toast.classList.remove('visible');fn();};
    toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),5500);
  }
  function syncNavigation(){
    const home=!location.hash||location.hash==='#start';
    const active=['cart','checkout','review'].includes(screen)?'bag':screen==='more'?'more':screen==='categories'?'catalog':home?'home':'catalog';
    nav.querySelectorAll('button').forEach(b=>{if(b.dataset.appNav===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const count=$('app-cart-count'); count.hidden=!cart.length;count.textContent=cart.length>99?'99+':String(cart.length);
    nav.querySelector('[data-app-nav="bag"]').setAttribute('aria-label',`Корзина, товаров: ${cart.length}`);
  }
  function syncPage(){
    const home=(!location.hash||location.hash==='#start')&&!query.trim();
    document.body.classList.toggle('app-home',home);document.body.classList.toggle('app-catalog',!home);
    document.querySelector('.hero').hidden=!home;
    document.querySelector('.coyli-quick').hidden=!home;
    if(!home)$('bestsellers').hidden=true;
    $('app-catalog-tools').hidden=cat==='Подарочные карты';
    $('app-reset-search').hidden=!query.trim();
    document.querySelector('#app-categories span').textContent=cat==='Все товары'?'Все разделы':label(cat);
    if(!$('grid').hidden&&!$('grid').querySelector('.item'))$('grid').innerHTML=`<div class="app-empty">${icon('search')}<h3>Пока ничего не нашли</h3><p>Попробуйте название бренда, аромата<br>или любимую ноту.</p><button type="button" class="primary" id="app-search-all">Смотреть все товары</button></div>`;
    const reset=$('app-search-all');if(reset)reset.onclick=()=>selectCategory('Все товары');
    syncNavigation();
  }
  render=function(){originalRender();syncPage();};
  saveCart=function(){originalSaveCart();syncNavigation();};
  selectCategory=function(value,push=true){screen='';unlock();originalSelectCategory(value,push);syncPage();};

  function goHome(push=true){
    if(push)history.pushState(null,'','#start');screen='';$('overlay').classList.remove('open');unlock();
    cat='Все товары';query='';collectionType='Все';$('search').value='';render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function lock(){
    if(document.body.classList.contains('app-modal-open'))return;
    restoreFocus=document.activeElement;document.body.classList.add('app-modal-open');
    document.querySelector('main').inert=true;document.querySelector('header').inert=true;nav.inert=true;
  }
  function unlock(){
    document.body.classList.remove('app-modal-open');document.querySelector('main').inert=false;document.querySelector('header').inert=false;nav.inert=false;
  }
  function routeSheet(name){
    if(!screen)modalReturnHash=/^#(?:product-\d+|cart|checkout|review|categories|more)$/.test(location.hash)?'#'+categoryRoutes[cat]:location.hash;
    if(location.hash!=='#'+name){const state={appOverlay:true,returnHash:modalReturnHash};if(screen)history.replaceState(state,'','#'+name);else history.pushState(state,'','#'+name);}
    screen=name;syncNavigation();
  }
  function head(title,back){return `<div class="app-sheet-head">${back?`<button type="button" class="app-icon-button" data-sheet-back aria-label="Назад">${icon('back')}</button>`:''}<h2 id="app-sheet-title">${esc(title)}</h2><button type="button" class="app-icon-button" data-sheet-close aria-label="Закрыть">${icon('close')}</button></div>`;}
  function sheet(title,body,footer='',back=null,keep=false){
    const panel=$('panel'),scroll=panel.scrollTop;
    toast.classList.remove('visible');
    lock();panel.className='panel app-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','app-sheet-title');panel.tabIndex=-1;
    panel.innerHTML=head(title,back)+`<div class="app-sheet-body">${body}</div>`+(footer?`<div class="app-sticky-action">${footer}</div>`:'');
    panel.querySelector('[data-sheet-close]').onclick=hide;
    if(back)panel.querySelector('[data-sheet-back]').onclick=back;
    $('overlay').classList.add('open');panel.scrollTop=keep?scroll:0;
    if(!keep)panel.focus({preventScroll:true});syncNavigation();
  }
  hide=function(){
    const target=history.state?.returnHash??modalReturnHash;
    $('overlay').classList.remove('open');screen='';unlock();
    if(/^#(?:product-\d+|cart|checkout|review|categories|more)$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+(target||''));
    syncPage();if(restoreFocus?.isConnected&&!restoreFocus.closest('#panel'))restoreFocus.focus({preventScroll:true});
  };
  function showCategories(){
    routeSheet('categories');
    const groups=[['Подборки',['Все товары','Новинки','Скидки','Осенняя коллекция']],['Парфюмерия',['Оригинал','Селектив','Люкс']],['Для себя и дома',['Крем-баттер','Мисты','Для дома','Рум-спрей','Диффузор','Свеча','Аромасаше','Автопарфюм']],['В подарок',['Подарочные карты']]];
    sheet('Каталог',groups.map(([title,items])=>`<p class="app-category-label">${title}</p><div class="app-category-list">${items.map(c=>`<button type="button" data-app-category="${esc(c)}" aria-current="${cat===c}"><span>${esc(label(c))}</span>${icon(cat===c?'check':'next')}</button>`).join('')}</div>`).join(''));
    $('panel').querySelectorAll('[data-app-category]').forEach(b=>b.onclick=()=>{hide();selectCategory(b.dataset.appCategory);});
  }
  function showMore(){
    routeSheet('more');
    const info=[['stores','Наши филиалы','Три магазина в Красноярске'],['delivery','Доставка','По Красноярску и России'],['loyalty','Бонусная программа','Ваша карта COYLI'],['contact','Связаться с нами','Поможем с выбором и заказом']];
    const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
    sheet('Ещё',`<p class="app-eyebrow">COYLI PARFUM</p><h3>Всегда рядом</h3><div class="app-category-list app-more-list">${info.map(([id,title,sub])=>`<button type="button" data-app-info="${id}"><span>${title}<small>${sub}</small></span>${icon('next')}</button>`).join('')}</div>${installed?'':`<div class="app-install-guide"><strong>COYLI на экране телефона</strong><p>${/iPad|iPhone|iPod/.test(navigator.userAgent)?'Откройте сайт в Safari → «Поделиться» → «На экран Домой». Если есть переключатель «Открывать как веб-приложение», включите его.':'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».'}</p>${installPrompt?'<button type="button" id="app-install" class="app-secondary-action">Установить COYLI</button>':''}</div>`}`);
    $('panel').querySelectorAll('[data-app-info]').forEach(b=>b.onclick=()=>{hide();document.querySelector(`[data-info="${b.dataset.appInfo}"]`).click();});
    if($('app-install'))$('app-install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;showMore();}};
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});

  productCard=function(x){
    const meta=(x.kind==='perfume'||x.kind==='original')?label(x.cat):`${label(x.cat)} · ${x.volumes.map(v=>unit({vol:v,cat:x.cat})).join(' / ')}`;
    return `<article class="item${x.isHit===true||x.isNew===true?' has-hit':''}"><button class="app-card-link" type="button" aria-label="Открыть ${esc(x.name)}" onclick="openProduct(${x.id})"></button><div class="visual ${x.kind==='home'?'home':x.kind==='car'?'car':''}"><div class="product-label-row">${x.isNew===true?'<span class="hit-badge new-badge">Новинка</span>':x.isHit===true?'<span class="hit-badge">Хит продаж</span>':''}${saleBadge(x)}</div><div class="product-image-area">${productPhoto(x)}</div></div><div class="name">${esc(x.name)}</div><div class="meta">${esc(meta)}</div>${x.cat==='Оригинал'?'<p class="availability">'+esc(availabilityText(x))+'</p>':''}<div class="bottom"><span class="price">${priceMarkup(x,basePrice(x),(x.kind==='perfume'||x.volumes.length>1)&&Number(price(x))>0?'от ':'')}</span><button type="button" class="plus" aria-label="Выбрать ${esc(x.name)}" onclick="openProduct(${x.id})">+</button></div></article>`;
  };
  openProduct=function(id,push=true){
    const item=p.find(x=>x.id===id);if(!isStorefrontProduct(item))return;
    if(!screen)modalReturnHash=/^#product-/.test(location.hash)?'#'+categoryRoutes[cat]:location.hash;
    current=item;format='spray';vol=String(item.kind==='perfume'?5:item.volumes[0]);
    if(push&&location.hash!=='#product-'+id)history.pushState({appOverlay:true,returnHash:modalReturnHash},'','#product-'+id);
    screen='product';drawProduct();
  };
  drawProduct=function(keep=false){
    const x=current;if(!x)return;
    let options=x.volumes,pr=x.price;
    if(x.cat==='Селектив'||x.cat==='Люкс'){pr=formatPrices(x,format);options=Object.keys(pr);if(!(vol in pr))vol=String(options[0]);}
    const regularAmount=pr[vol],amount=saleAmount(x,regularAmount),unavailable=x.kind==='original'&&x.availability?.status==='out_of_stock';
    const canAdd=Number.isFinite(Number(amount))&&Number(amount)>0&&!unavailable;
    const body=`<div class="app-product-photo">${productPhoto(x,vol)}</div><p class="app-eyebrow">${esc(label(x.cat))}</p><h3 class="app-product-title">${esc(x.name)}</h3>${x.gender?'<p class="app-product-gender">'+esc(x.gender)+'</p>':''}${x.kind==='perfume'?`<h4>Формат</h4><div class="app-format-grid" aria-label="Формат аромата"><button type="button" data-format="spray" aria-pressed="${format==='spray'}">Спрей</button><button type="button" data-format="oil" aria-pressed="${format==='oil'}">Чистое масло</button></div>`:''}<h4>${x.kind==='car'?'Количество в упаковке':x.cat==='Аромасаше'?'Вес':'Объём'}</h4><div class="app-volume-grid" aria-label="Выбор объёма">${options.map(v=>`<button type="button" data-volume="${esc(v)}" aria-pressed="${String(vol)===String(v)}">${esc(unit({vol:v,cat:x.cat}))}</button>`).join('')}</div><p class="muted">${esc(availabilityText(x))}</p>${x.cat==='Оригинал'&&Number(vol)===100?'<p class="muted">100 мл — если во флаконе есть нужное количество. Уточните у менеджера.</p>':''}<details class="app-product-description"><summary>Об аромате и ноты ${icon('down')}</summary><p>${esc(x.notes||'Описание и ноты аромата будут добавлены после проверки.')}</p></details><button type="button" class="app-share" id="app-share-product">Скопировать ссылку на товар</button>`;
    sheet('Выбор товара',body,`<div class="app-buy-row"><div class="price">${priceMarkup(x,regularAmount)}</div><button type="button" class="primary" id="add-to-cart" ${canAdd?'':'disabled'}>${unavailable?'Нет в наличии':'В корзину'}</button></div>`,null,keep);
    $('panel').querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{format=b.dataset.format;vol=format==='oil'?'2':'5';drawProduct(true);$('panel').querySelector(`[data-format="${format}"]`).focus({preventScroll:true});});
    $('panel').querySelectorAll('[data-volume]').forEach(b=>b.onclick=()=>{vol=b.dataset.volume;drawProduct(true);$('panel').querySelector(`[data-volume="${CSS.escape(vol)}"]`).focus({preventScroll:true});});
    $('app-share-product').onclick=()=>copyProductLink(x.id,$('app-share-product'));
    $('add-to-cart').onclick=()=>{if(!canAdd)return;cart.push({productId:x.id,name:x.name,cat:x.cat,format:x.kind==='perfume'?(format==='spray'?'Спрей':'Масло'):'',vol,amount:Number(amount)});saveCart();hide();notify('Добавлено в корзину','Открыть',showCart);};
  };

  function groups(){
    const result=[],byKey=new Map();
    cart.forEach((x,i)=>{const key=x.bundleInstance?'bundle:'+x.bundleInstance:JSON.stringify([x.name,x.cat,x.format||'',String(x.vol),x.amount]);let group=byKey.get(key);if(!group){group={key,item:x,indices:[],total:0};byKey.set(key,group);result.push(group);}group.indices.push(i);group.total+=Number(x.amount);});return result;
  }
  function productFor(x){return p.find(y=>y.id===x.productId)||p.find(y=>y.name===x.name&&y.cat===x.cat);}
  function groupTitle(g){return g.item.bundleInstance?'Набор «'+(g.item.bundle||'Подарок')+'»':g.item.name;}
  function groupDetails(g){return g.item.bundleInstance?g.indices.map(i=>cart[i].name+' · '+unit(cart[i])).join(', '):[g.item.cat,g.item.format,unit(g.item)].filter(Boolean).join(' · ');}
  function removeGroup(g){
    undoCart=g.indices.map(i=>({index:i,item:{...cart[i]}}));const removed=new Set(g.indices);cart=cart.filter((_,i)=>!removed.has(i));saveCart();showCart(true);
    notify('Товар удалён','Вернуть',()=>{if(undoCart){for(const entry of undoCart)cart.splice(Math.min(entry.index,cart.length),0,entry.item);undoCart=null;saveCart();showCart(true);}});
  }
  showCart=function(keep=false){
    routeSheet('cart');const rows=groups(),total=amountTotal();
    if(!rows.length){sheet('Корзина',`<div class="app-empty">${icon('bag')}<h3>Здесь будет ваш выбор</h3><p>Добавьте любимый аромат<br>или найдите что-то новое.</p><button type="button" class="primary" id="app-empty-catalog">Перейти в каталог</button></div>`);$('app-empty-catalog').onclick=()=>{hide();selectCategory('Все товары');};return;}
    const body=rows.map((g,i)=>{const x=g.item,item=productFor(x),bundle=!!x.bundleInstance;return `<div class="app-cart-row"><div class="app-cart-thumb">${item?productPhoto(item,x.vol):icon('bag')}</div><div class="app-cart-content"><h3>${esc(groupTitle(g))}</h3><button class="app-remove" type="button" data-remove-group="${i}" aria-label="Удалить ${esc(groupTitle(g))}">${icon('trash')}</button><p class="app-cart-detail">${esc(groupDetails(g))}</p>${bundle&&x.packaging?'<p class="app-cart-detail">Фирменный пакет в комплекте</p>':''}<div class="app-cart-row-bottom">${bundle?'':`<div class="app-quantity"><button type="button" data-minus="${i}" aria-label="Уменьшить количество ${esc(x.name)}">−</button><output aria-label="Количество ${esc(x.name)}">${g.indices.length}</output><button type="button" data-plus="${i}" aria-label="Увеличить количество ${esc(x.name)}">+</button></div>`}<strong>${money(g.total)}</strong></div></div></div>`;}).join('')+`<div class="app-delivery-progress">${total>=5000?'Доставка бесплатно':`До бесплатной доставки — ${money(5000-total)}`}<div class="app-progress-track"><span style="width:${Math.min(total/5000*100,100)}%"></span></div></div><p class="app-checkout-note">Наличие товаров и условия получения подтвердит менеджер. Оплата — после согласования заказа.</p>`;
    sheet('Корзина · '+cart.length,body,`<div class="app-cart-total"><span>Товары</span><strong>${money(total)}</strong></div><button type="button" class="primary" id="app-checkout">К оформлению</button>`,null,keep);
    $('app-checkout').onclick=showCheckout;
    $('panel').querySelectorAll('[data-remove-group]').forEach(b=>b.onclick=()=>removeGroup(rows[Number(b.dataset.removeGroup)]));
    $('panel').querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const index=b.dataset.minus,g=rows[Number(index)];if(g.indices.length===1){removeGroup(g);return;}cart.splice(g.indices.at(-1),1);saveCart();showCart(true);$('panel').querySelector(`[data-minus="${index}"]`)?.focus({preventScroll:true});});
    $('panel').querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{const index=b.dataset.plus;cart.push({...rows[Number(index)].item});saveCart();showCart(true);$('panel').querySelector(`[data-plus="${index}"]`)?.focus({preventScroll:true});});
  };

  function detailsForm(){
    const originals=cart.some(x=>x.cat==='Оригинал');if(originals&&draft.branch&&draft.branch!=='Ньютон')draft.branch='Ньютон';
    return `<div class="app-checkout-steps"><b>1. Получение</b><span></span>2. Проверка</div><h3>Как вам удобно?</h3><form id="app-checkout-form"><div class="app-choice-grid"><label><input type="radio" name="method" value="pickup" ${draft.method==='pickup'?'checked':''}>Самовывоз</label><label><input type="radio" name="method" value="delivery" ${draft.method==='delivery'?'checked':''}>Доставка</label></div><div id="app-pickup-fields" ${draft.method==='pickup'?'':'hidden'}><label class="app-field"><span>Филиал</span><select name="branch" id="app-branch" ${draft.method==='pickup'?'required':''}><option value="">Выберите филиал</option>${[['Ньютон','ТК «Ньютон» · Партизана Железняка, 17'],['Квант','ТК «Квант» · Красной Армии, 10'],['Городской','ТЦ «Городской» · Красноярский рабочий, 8']].map(([id,text])=>`<option value="${id}" ${draft.branch===id?'selected':''} ${originals&&id!=='Ньютон'?'disabled':''}>${text}</option>`).join('')}</select><span class="app-field-help">${originals?'Оригинальная парфюмерия представлена в ТК «Ньютон».':'Наличие товаров в выбранном филиале подтвердит менеджер.'}</span></label></div><div id="app-delivery-fields" ${draft.method==='delivery'?'':'hidden'}><label class="app-field"><span>Город доставки</span><input name="city" id="app-city" value="${esc(draft.city)}" placeholder="Например, Красноярск" autocomplete="address-level2" maxlength="100" ${draft.method==='delivery'?'required':''}><span class="app-field-help">Адрес и способ доставки согласуем с вами в Telegram.${amountTotal()>=5000?' Доставка бесплатно.':' Стоимость доставки уточнит менеджер.'}</span></label></div><label class="app-field"><span>Как к вам обращаться <small>· необязательно</small></span><input name="customerName" value="${esc(draft.name)}" autocomplete="given-name" maxlength="80" placeholder="Ваше имя"></label><label class="app-field"><span>Комментарий <small>· необязательно</small></span><textarea name="comment" maxlength="500" rows="3" placeholder="Пожелания к заказу или вопрос">${esc(draft.comment)}</textarea></label></form>`;
  }
  function readDraft(){
    const f=$('app-checkout-form');if(!f)return;
    const data=new FormData(f);draft={method:data.get('method')==='delivery'?'delivery':'pickup',branch:String(data.get('branch')||''),city:String(data.get('city')||'').trim(),name:String(data.get('customerName')||'').trim(),comment:String(data.get('comment')||'').trim()};
  }
  function showCheckout(){
    if(!cart.length){showCart();return;}routeSheet('checkout');
    sheet('Оформление',detailsForm(),`<button type="submit" form="app-checkout-form" class="primary">Проверить заказ · ${money(amountTotal())}</button><p class="app-hint">Следующий шаг — проверка заказа перед отправкой менеджеру.</p>`,()=>showCart());
    const form=$('app-checkout-form');form.oninput=readDraft;
    form.querySelectorAll('[name="method"]').forEach(r=>r.onchange=()=>{readDraft();const pickup=draft.method==='pickup';$('app-pickup-fields').hidden=!pickup;$('app-delivery-fields').hidden=pickup;$('app-branch').required=pickup;$('app-city').required=!pickup;});
    form.onsubmit=e=>{e.preventDefault();readDraft();if(draft.method==='delivery'&&!draft.city){$('app-city').setCustomValidity('Укажите город доставки');$('app-city').reportValidity();return;}$('app-city').setCustomValidity('');showReview();};
    $('app-city').addEventListener('input',()=>{$('app-city').setCustomValidity('');});
  }
  cartText=function(){
    const rows=groups();
    const lines=rows.map((g,i)=>`${i+1}. ${groupTitle(g)}\n${groupDetails(g)}${g.item.bundleInstance?'':' · '+g.indices.length+' шт.'} — ${money(g.total)}`);
    return 'Здравствуйте! Хочу оформить заказ COYLI PARFUM.\n\n'+lines.join('\n\n')+'\n\nТовары: '+money(amountTotal())+(draft.method==='delivery'?'\nПолучение: доставка\nГород: '+draft.city+'\nДоставка: '+(amountTotal()>=5000?'бесплатно':'стоимость уточнить'):'\nПолучение: самовывоз\nФилиал: '+draft.branch)+(draft.name?'\nИмя: '+draft.name:'')+(draft.comment?'\nКомментарий: '+draft.comment:'')+(cart.some(x=>x.packaging)?'\nФирменный пакет к каждому подарку — бесплатно.':'')+'\n\nПодтвердите, пожалуйста, наличие, итоговую сумму и способ оплаты.';
  };
  async function copyOrder(){
    try{await navigator.clipboard.writeText(cartText());notify('Заказ скопирован');}
    catch{const field=$('app-order-text');field.closest('details').open=true;field.focus();field.select();notify('Выделили заказ — скопируйте текст');}
  }
  function showReview(){
    if(!cart.length){showCart();return;}routeSheet('review');
    const text=cartText(),long=[...text].length>3800||encodeURIComponent(text).length>14000;
    const url='https://t.me/coyli_parfum'+(long?'':'?text='+encodeURIComponent(text));
    const body=`<div class="app-checkout-steps">1. Получение<span></span><b>2. Проверка</b></div><h3>Всё верно?</h3><div class="app-review-items">${groups().map(g=>`<div class="app-review-line"><span>${esc(groupTitle(g))}<small>${esc(groupDetails(g))}${g.item.bundleInstance?'':' · '+g.indices.length+' шт.'}</small></span><strong>${money(g.total)}</strong></div>`).join('')}</div><div class="app-cart-total"><span>Товары</span><strong>${money(amountTotal())}</strong></div><dl class="app-review-info"><dt>Получение</dt><dd>${draft.method==='delivery'?'Доставка · '+esc(draft.city):'Самовывоз · '+esc(draft.branch)}</dd>${draft.method==='delivery'?`<dt>Доставка</dt><dd>${amountTotal()>=5000?'Бесплатно':'Стоимость уточнит менеджер'}</dd>`:''}${draft.name?'<dt>Имя</dt><dd>'+esc(draft.name)+'</dd>':''}${draft.comment?'<dt>Комментарий</dt><dd>'+esc(draft.comment)+'</dd>':''}</dl><p class="app-checkout-note">Заказ ещё не отправлен. В Telegram проверьте сообщение и нажмите «Отправить». Менеджер подтвердит наличие, итоговую сумму и оплату.</p><details class="app-product-description"><summary>Текст сообщения ${icon('down')}</summary><label class="app-sr" for="app-order-text">Сообщение менеджеру</label><textarea id="app-order-text" class="app-order-text" readonly>${esc(text)}</textarea></details>`;
    sheet('Проверка заказа',body,`${long?'<p class="app-order-warning">Заказ получился длинным. Скопируйте текст и отправьте его менеджеру частями.</p>':''}<a class="primary app-telegram-link" id="app-telegram" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Открыть заказ в Telegram</a><button type="button" class="app-secondary-action" id="app-copy-order">Скопировать заказ</button><p class="app-hint">Если текст не появился в Telegram, скопируйте его и вставьте в чат.</p>`,showCheckout);
    $('app-copy-order').onclick=copyOrder;
  }

  // Browser Back closes sheets and restores category/product deep links.
  window.removeEventListener('popstate',originalRoute);window.removeEventListener('hashchange',originalRoute);
  function appRoute(){
    const hash=location.hash;
    if(hash==='#cart'){showCart();return;}
    if(hash==='#categories'){showCategories();return;}
    if(hash==='#more'){showMore();return;}
    if(hash==='#checkout'||hash==='#review'){showCheckout();return;}
    if(/^#product-\d+$/.test(hash)){openProduct(Number(hash.slice(9)),false);return;}
    screen='';$('overlay').classList.remove('open');unlock();if(!hash||hash==='#start')goHome(false);else originalRoute();syncPage();
  }
  applyCatalogRoute=appRoute;
  window.addEventListener('popstate',appRoute);window.addEventListener('hashchange',appRoute);
  document.addEventListener('keydown',e=>{
    if(!$('overlay').classList.contains('open'))return;
    if(e.key==='Escape'){e.preventDefault();hide();return;}
    if(e.key==='Tab'){
      const items=[...$('panel').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea,summary,[tabindex="0"]')].filter(x=>x.getClientRects().length);
      const first=items[0],last=items.at(-1);if(!first)return;
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('panel'))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('panel'))){e.preventDefault();first.focus();}
    }
  });
  // Backdrop dismissal also restores focus and page scrolling.
  $('overlay').onclick=e=>{if(e.target===$('overlay'))hide();};
  window.addEventListener('storage',e=>{if(e.key!=='coyli-cart')return;try{const next=JSON.parse(e.newValue||'[]');if(Array.isArray(next)){cart=next.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.amount)&&x.amount>0&&x.vol!=null);originalSaveCart();syncNavigation();if(screen==='cart')showCart(true);else if(screen==='checkout'||screen==='review')showCart();}}catch{}});
  window.CoyliApp={notify,sync:syncPage};
  render();if(location.hash)appRoute();
})();
