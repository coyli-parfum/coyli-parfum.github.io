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
  const J=CoyliJourney, label=J.label;
  const unit = x => `${x.vol}${/[^\d.,\s]/.test(String(x.vol)) ? '' : x.cat === 'Аромасаше' ? ' г' : ' мл'}`;
  const amountTotal = () => {repriceCart();return cart.reduce((s,x) => s + Number(x.amount),0);};
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
  $('search').before(tools); const categoryContext=document.createElement('div'); categoryContext.id='app-catalog-context'; tools.after(categoryContext); $('search').setAttribute('aria-label','Поиск по названию, бренду или нотам'); $('search').setAttribute('type','search'); $('search').setAttribute('enterkeyhint','search');
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
    const root=J.parent(cat),sub=J.children[root]||[];
    categoryContext.hidden=cat==='Подарочные карты'||!J.sections.includes(root);
    categoryContext.innerHTML=(J.descriptions[root]?'<p class="app-category-description">'+esc(J.descriptions[root])+'</p>':'')+(sub.length?'<div class="app-subcategories" role="group" aria-label="Виды товаров">'+[root,...sub].map(c=>'<button type="button" data-subcategory="'+esc(c)+'" aria-pressed="'+(cat===c)+'">'+esc(c===root?'Все':label(c))+'</button>').join('')+'</div>':'');
    categoryContext.querySelectorAll('[data-subcategory]').forEach(b=>b.onclick=()=>selectCategory(b.dataset.subcategory));
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
    if(!screen)modalReturnHash=/^#(?:product-\d+|cart|checkout|review|categories|more|request|request-review)$/.test(location.hash)?'#'+categoryRoutes[cat]:location.hash;
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
    if(/^#(?:product-\d+|cart|checkout|review|categories|more|request|request-review)$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+(target||''));
    syncPage();if(restoreFocus?.isConnected&&!restoreFocus.closest('#panel'))restoreFocus.focus({preventScroll:true});
  };
  function showCategories(){
    routeSheet('categories');
    const groups=[['Разделы',J.sections],['Подборки',['Все товары','Новинки','Скидки','Осенняя коллекция']]];
    sheet('Каталог',groups.map(([title,items])=>`<p class="app-category-label">${title}</p><div class="app-category-list">${items.map(c=>`<button type="button" data-app-category="${esc(c)}" aria-current="${J.parent(cat)===c}"><span>${esc(label(c))}${J.descriptions[c]?'<small>'+esc(J.descriptions[c])+'</small>':''}</span>${icon(J.parent(cat)===c?'check':'next')}</button>`).join('')}</div>`).join(''));
    $('panel').querySelectorAll('[data-app-category]').forEach(b=>b.onclick=()=>{hide();selectCategory(b.dataset.appCategory);});
  }
  function showMore(){
    routeSheet('more');
    const info=[['stores','Наши филиалы','Три магазина в Красноярске'],['delivery','Доставка','По Красноярску и России'],['loyalty','Бонусная программа','Ваша карта COYLI'],['contact','Связаться с нами','Поможем с выбором и заказом']];
    const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
    sheet('Ещё',`<p class="app-eyebrow">COYLI PARFUM</p><h3>Всегда рядом</h3><div class="app-category-list app-more-list">${info.map(([id,title,sub])=>`<button type="button" data-app-info="${id}"><span>${title}<small>${sub}</small></span>${icon('next')}</button>`).join('')}</div>${installed?'':`<div class="app-install-guide"><strong>COYLI на экране телефона</strong><p>${/iPad|iPhone|iPod/.test(navigator.userAgent)?'Откройте сайт в Safari → «Поделиться» → «На экран Домой». Если есть переключатель «Открывать как веб-приложение», включите его.':'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».'}</p>${installPrompt?'<button type="button" id="app-install" class="app-secondary-action">Установить COYLI</button>':''}</div>`}`);
    $('panel').querySelectorAll('[data-app-info]').forEach(b=>b.onclick=()=>{if(b.dataset.appInfo==='contact'){beginRequest(null,'advice');return;}hide();document.querySelector(`[data-info="${b.dataset.appInfo}"]`).click();});
    if($('app-install'))$('app-install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;showMore();}};
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});

  productCard=function(x){
    const meta=(x.kind==='perfume'||x.kind==='original')?J.type(x.cat)+(CoyliSale.active()?' · '+(x.kind==='perfume'?'спрей · ':'')+defaultVolume(x)+' мл':''):`${label(x.cat)} · ${x.volumes.map(v=>unit({vol:v,cat:x.cat})).join(' / ')}`;
    return `<article class="item${x.isHit===true||x.isNew===true?' has-hit':''}"><button class="app-card-link" type="button" aria-label="Открыть ${esc(x.name)}" onclick="openProduct(${x.id})"></button><div class="visual ${x.kind==='home'?'home':x.kind==='car'?'car':''}"><div class="product-label-row">${x.isNew===true?'<span class="hit-badge new-badge">Новинка</span>':x.isHit===true?'<span class="hit-badge">Хит продаж</span>':''}${saleBadge(x)}</div><div class="product-image-area">${productPhoto(x)}</div></div><div class="name">${esc(x.name)}</div><div class="meta">${esc(meta)}</div>${x.cat==='Оригинал'?'<p class="availability">'+esc(availabilityText(x))+'</p>':''}<div class="bottom"><span class="price">${priceMarkup(x,basePrice(x),!CoyliSale.active()&&(x.kind==='perfume'||x.volumes.length>1)&&Number(price(x))>0?'от ':'')}</span><button type="button" class="plus" aria-label="Выбрать ${esc(x.name)}" onclick="openProduct(${x.id})">+</button></div></article>`;
  };
  openProduct=function(id,push=true){
    const item=p.find(x=>x.id===id);if(!isStorefrontProduct(item))return;
    if(!screen)modalReturnHash=/^#product-/.test(location.hash)?'#'+categoryRoutes[cat]:location.hash;
    current=item;format='spray';vol=defaultVolume(item);
    if(push&&location.hash!=='#product-'+id)history.pushState({appOverlay:true,returnHash:modalReturnHash},'','#product-'+id);
    screen='product';drawProduct();
  };
  drawProduct=function(keep=false){
    const x=current;if(!x)return;
    let options=x.volumes,pr=x.price;
    if(x.cat==='Селектив'||x.cat==='Люкс'){pr=formatPrices(x,format);options=Object.keys(pr);if(!(vol in pr))vol=String(options[0]);}
    const regularAmount=pr[vol],amount=saleAmount(x,regularAmount,vol,format),unavailable=x.kind==='original'&&x.availability?.status==='out_of_stock';
    const canAdd=Number.isFinite(Number(amount))&&Number(amount)>0&&!unavailable;
    const body=`<div class="app-product-photo">${productPhoto(x,vol)}</div><p class="app-eyebrow">${esc(J.type(x.cat))}</p><h3 class="app-product-title">${esc(x.name)}</h3>${x.gender?'<p class="app-product-gender">'+esc(x.gender)+'</p>':''}${x.kind==='perfume'?'<p class="app-product-kind-note">Аналог аромата на масляной основе COYLI. Фото показывает аромат-ориентир. Доступны масло и спрей.</p>':x.kind==='original'?'<p class="app-product-kind-note">Распив оригинального аромата. Полноразмерный флакон можно запросить отдельно.</p>':''}${x.kind==='perfume'?`<h4>Формат</h4><div class="app-format-grid" aria-label="Формат аромата"><button type="button" data-format="spray" aria-pressed="${format==='spray'}">Спрей</button><button type="button" data-format="oil" aria-pressed="${format==='oil'}">Чистое масло</button></div>`:''}<h4>${x.kind==='car'?'Количество в упаковке':x.cat==='Аромасаше'?'Вес':'Объём'}</h4><div class="app-volume-grid" aria-label="Выбор объёма">${options.map(v=>`<button type="button" data-volume="${esc(v)}" aria-pressed="${String(vol)===String(v)}">${esc(unit({vol:v,cat:x.cat}))}</button>`).join('')}</div><p class="muted">${esc(availabilityText(x))}</p>${saleNote()}${x.cat==='Оригинал'&&Number(vol)===100?'<p class="muted">100 мл — если во флаконе есть нужное количество. Уточните у менеджера.</p>':''}<details class="app-product-description"><summary>Об аромате и ноты ${icon('down')}</summary><p>${esc(x.notes||'Описание и ноты аромата будут добавлены после проверки.')}</p></details><button type="button" class="app-share" id="app-share-product">Скопировать ссылку на товар</button>`;
    sheet('Выбор товара',body,`<div class="app-buy-row"><div class="price">${priceMarkup(x,regularAmount,'',vol,format)}</div><button type="button" class="primary" id="add-to-cart" ${canAdd?'':'disabled'}>${unavailable?'Нет в наличии':'В корзину'}</button></div><button type="button" class="app-secondary-action app-request-product" id="app-request-product">Наличие, доставка или вопрос</button>`,null,keep);
    $('panel').querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{format=b.dataset.format;vol=format==='oil'?'2':defaultVolume(current);drawProduct(true);$('panel').querySelector(`[data-format="${format}"]`).focus({preventScroll:true});});
    $('panel').querySelectorAll('[data-volume]').forEach(b=>b.onclick=()=>{vol=b.dataset.volume;drawProduct(true);$('panel').querySelector(`[data-volume="${CSS.escape(vol)}"]`).focus({preventScroll:true});});
    $('app-request-product').onclick=()=>beginRequest({product:{id:x.id,name:x.name,cat:x.cat,vol,format:x.kind==='perfume'?(format==='oil'?'Чистое масло':'Спрей'):'',quantity:1},url:new URL('#product-'+x.id,location.href).href},'availability',()=>{screen='product';history.replaceState(history.state,'','#product-'+x.id);drawProduct();});
    $('app-share-product').onclick=()=>copyProductLink(x.id,$('app-share-product'));
    $('add-to-cart').onclick=()=>{if(!canAdd)return;cart.push({productId:x.id,name:x.name,cat:x.cat,format:x.kind==='perfume'?(format==='spray'?'Спрей':'Масло'):'',vol,amount:Number(saleAmount(x,pr[vol],vol,format))});saveCart();hide();notify('Добавлено в корзину','Открыть',showCart);};
  };

  let requestContext={},requestDraft={},requestBack=null;
  function beginRequest(context=null,purpose='availability',back=null){
    requestContext=context||{};requestBack=back;
    requestDraft={purpose,branch:context?.product?.cat==='Оригинал'?'Ньютон':'',city:'',district:'',deliveryWay:'',name:'',comment:'',visit:'',method:'pickup',bottleVolume:''};
    showRequest();
  }
  function readRequest(){
    const form=$('app-request-form');if(!form)return;
    const data=new FormData(form);for(const key of ['purpose','branch','city','district','deliveryWay','name','comment','visit','method','bottleVolume'])if(data.has(key))requestDraft[key]=String(data.get(key)||'').trim();
  }
  function requestFields(){
    const d=requestDraft,bottle=d.purpose==='bottle',pickup=['availability','pickup'].includes(d.purpose)||(bottle&&d.method==='pickup'),delivery=d.purpose==='delivery'||(bottle&&d.method==='delivery');
    if($('request-product-type'))$('request-product-type').textContent=bottle?'Оригинальный полноразмерный флакон':J.type(requestContext.product.cat);
    if($('request-product-volume'))$('request-product-volume').hidden=bottle;
    const sections={'request-branch-fields':pickup,'request-delivery-fields':delivery,'request-visit-fields':d.purpose==='pickup','request-bottle-fields':bottle};
    for(const [id,visible] of Object.entries(sections)){const el=$(id);el.hidden=!visible;el.querySelectorAll('input,select').forEach(x=>x.disabled=!visible);}
    $('request-branch').required=pickup;$('request-city').required=delivery;$('request-bottleVolume').required=bottle;
    const commentRequired=['advice','question'].includes(d.purpose)||(!requestContext.product&&!requestContext.giftText);
    $('request-comment').required=commentRequired;
    $('request-comment-label').textContent=d.purpose==='advice'?'Что хочется подобрать?':d.purpose==='question'?'Ваш вопрос':!requestContext.product&&!requestContext.giftText?'Какой товар вас интересует?':'Комментарий · необязательно';
    $('request-comment').placeholder=d.purpose==='advice'?'Для кого выбираете, любимые ароматы или ноты, примерный бюджет':d.purpose==='question'?'Что хотите узнать о товаре?':'Пожелания к покупке';
    $('request-branch-help').textContent=requestContext.product?.cat==='Оригинал'?'Оригинальная парфюмерия представлена в ТК «Ньютон».':d.purpose==='pickup'?'Бронь действует только после подтверждения менеджера.':'Проверим наличие именно в этом магазине.';
  }
  function showRequest(){
    if(!requestDraft.purpose)requestDraft={purpose:'advice',method:'pickup'};
    routeSheet('request');
    const d=requestDraft,x=requestContext.product,original=x?.cat==='Оригинал';
    const options=J.purposes.filter(([id])=>id!=='bottle'||original);
    const body=`<p class="app-request-intro">Выберите цель обращения — подготовим сообщение с нужными деталями.</p>${x?`<div class="app-request-selection"><strong>${esc(x.name)}</strong><span id="request-product-type">${esc(J.type(x.cat))}</span><span id="request-product-volume">${esc([x.format,J.unit(x)].filter(Boolean).join(' · '))}</span></div>`:requestContext.giftText?'<p class="app-request-selection">'+esc(requestContext.giftText).replace(/\n/g,'<br>')+'</p>':''}<form id="app-request-form"><fieldset class="app-intents"><legend>С чем помочь?</legend>${options.map(([id,title,description])=>`<label><input type="radio" name="purpose" value="${id}" ${d.purpose===id?'checked':''}><span><strong>${title}</strong><small>${description}</small></span></label>`).join('')}</fieldset><div id="request-bottle-fields"><label class="app-field"><span>Желаемый объём флакона</span><input id="request-bottleVolume" name="bottleVolume" maxlength="80" value="${esc(d.bottleVolume||'')}" placeholder="Например, 50 или 100 мл"></label><p class="app-field-help">Это запрос цены и возможности привоза. Стоимость распива к полному флакону не применяется.</p><label class="app-field"><span>Как получить?</span><select id="request-method" name="method"><option value="pickup" ${d.method==='pickup'?'selected':''}>Самовывоз</option><option value="delivery" ${d.method==='delivery'?'selected':''}>Доставка</option></select></label></div><div id="request-branch-fields"><label class="app-field"><span>Филиал</span><select id="request-branch" name="branch"><option value="">Выберите филиал</option>${J.branches.map(b=>`<option value="${b}" ${d.branch===b?'selected':''} ${original&&b!=='Ньютон'?'disabled':''}>${b==='Городской'?'ТЦ':'ТК'} «${b}»</option>`).join('')}</select><span class="app-field-help" id="request-branch-help"></span></label></div><div id="request-visit-fields"><label class="app-field"><span>Когда планируете забрать? · необязательно</span><input name="visit" value="${esc(d.visit||'')}" maxlength="100" placeholder="Например, завтра после 18:00"></label></div><div id="request-delivery-fields"><label class="app-field"><span>Город доставки</span><input id="request-city" name="city" value="${esc(d.city||'')}" maxlength="100" autocomplete="address-level2" placeholder="Например, Красноярск"></label><label class="app-field"><span>Район · необязательно</span><input name="district" value="${esc(d.district||'')}" maxlength="100" placeholder="Поможет уточнить доставку по городу"></label><p class="app-field-help">Срок и стоимость доставки подтвердит менеджер. Точный адрес можно сообщить в переписке.</p></div><label class="app-field"><span>Как к вам обращаться · необязательно</span><input name="name" value="${esc(d.name||'')}" maxlength="80" autocomplete="given-name"></label><label class="app-field"><span id="request-comment-label"></span><textarea id="request-comment" name="comment" maxlength="600" rows="3">${esc(d.comment||'')}</textarea></label><p id="request-error" class="app-form-error" role="alert"></p></form>`;
    sheet('Написать в COYLI',body,'<button class="primary" type="submit" form="app-request-form">Подготовить сообщение</button><p class="app-hint">Вы увидите текст перед переходом в Telegram.</p>',requestBack);
    requestFields();const form=$('app-request-form');form.oninput=readRequest;
    form.querySelectorAll('[name="purpose"], [name="method"]').forEach(input=>input.onchange=()=>{readRequest();requestFields();$('request-error').textContent='';});
    form.onsubmit=e=>{e.preventDefault();readRequest();const error=J.validate(d,{original,product:!!x||!!requestContext.giftText});if(error){$('request-error').textContent=error.message;form.querySelector(`[name="${error.field}"]`)?.focus();return;}showRequestReview();};
  }
  function showRequestReview(){
    routeSheet('request-review');const text=J.message(requestDraft,requestContext),link=J.telegram(text);
    sheet('Ваше сообщение',`<p class="app-request-intro">Всё верно? Можно вернуться и изменить детали.</p><label class="app-sr" for="app-request-text">Сообщение менеджеру</label><textarea id="app-request-text" class="app-order-text app-request-text" readonly>${esc(text)}</textarea><p class="app-checkout-note">Сообщение ещё не отправлено. В Telegram проверьте текст и нажмите «Отправить».</p>`,`${link.long?'<p class="app-order-warning">Сообщение длинное: скопируйте его и вставьте в чат.</p>':''}<a class="primary app-telegram-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">Открыть сообщение в Telegram</a><button class="app-secondary-action" type="button" id="app-copy-request">Скопировать сообщение</button><p class="app-hint">Если Telegram открылся без текста, вставьте скопированное сообщение.</p>`,showRequest);
    $('app-copy-request').onclick=async()=>{try{await navigator.clipboard.writeText(text);notify('Сообщение скопировано');}catch{$('app-request-text').focus();$('app-request-text').select();notify('Выделили текст — скопируйте сообщение');}};
  }

  function groups(){
    const result=[],byKey=new Map();
    cart.forEach((x,i)=>{const key=x.bundleInstance?'bundle:'+x.bundleInstance:JSON.stringify([x.name,x.cat,x.format||'',String(x.vol),x.amount]);let group=byKey.get(key);if(!group){group={key,item:x,indices:[],total:0};byKey.set(key,group);result.push(group);}group.indices.push(i);group.total+=Number(x.amount);});return result;
  }
  function productFor(x){return p.find(y=>y.id===x.productId)||p.find(y=>y.name===x.name&&y.cat===x.cat);}
  function groupTitle(g){return g.item.bundleInstance?'Набор «'+(g.item.bundle||'Подарок')+'»':g.item.name;}
  function groupDetails(g){return g.item.bundleInstance?g.indices.map(i=>cart[i].name+' · '+unit(cart[i])).join(', '):[J.type(g.item.cat),g.item.format,unit(g.item)].filter(Boolean).join(' · ');}
  function removeGroup(g){
    undoCart=g.indices.map(i=>({index:i,item:{...cart[i]}}));const removed=new Set(g.indices);cart=cart.filter((_,i)=>!removed.has(i));saveCart();showCart(true);
    notify('Товар удалён','Вернуть',()=>{if(undoCart){for(const entry of undoCart)cart.splice(Math.min(entry.index,cart.length),0,entry.item);undoCart=null;saveCart();showCart(true);}});
  }
  showCart=function(keep=false){
    repriceCart();routeSheet('cart');const rows=groups(),total=amountTotal();
    if(!rows.length){sheet('Корзина',`<div class="app-empty">${icon('bag')}<h3>Здесь будет ваш выбор</h3><p>Добавьте любимый аромат<br>или найдите что-то новое.</p><button type="button" class="primary" id="app-empty-catalog">Перейти в каталог</button></div>`);$('app-empty-catalog').onclick=()=>{hide();selectCategory('Все товары');};return;}
    const body=saleNote()+rows.map((g,i)=>{const x=g.item,item=productFor(x),bundle=!!x.bundleInstance;return `<div class="app-cart-row"><div class="app-cart-thumb">${item?productPhoto(item,x.vol):icon('bag')}</div><div class="app-cart-content"><h3>${esc(groupTitle(g))}</h3><button class="app-remove" type="button" data-remove-group="${i}" aria-label="Удалить ${esc(groupTitle(g))}">${icon('trash')}</button><p class="app-cart-detail">${esc(groupDetails(g))}</p>${bundle&&x.packaging?'<p class="app-cart-detail">Фирменный пакет в комплекте</p>':''}<div class="app-cart-row-bottom">${bundle?'':`<div class="app-quantity"><button type="button" data-minus="${i}" aria-label="Уменьшить количество ${esc(x.name)}">−</button><output aria-label="Количество ${esc(x.name)}">${g.indices.length}</output><button type="button" data-plus="${i}" aria-label="Увеличить количество ${esc(x.name)}">+</button></div>`}<strong>${money(g.total)}</strong></div></div></div>`;}).join('')+`<div class="app-delivery-progress">${total>=5000?'Доставка бесплатно':`До бесплатной доставки — ${money(5000-total)}`}<div class="app-progress-track"><span style="width:${Math.min(total/5000*100,100)}%"></span></div></div><p class="app-checkout-note">Наличие товаров и условия получения подтвердит менеджер. Оплата — после согласования заказа.</p>`;
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
  cartText=function(){repriceCart();
    const rows=groups();
    const lines=rows.map((g,i)=>`${i+1}. ${groupTitle(g)}\n${groupDetails(g)}${g.item.bundleInstance?'':' · '+g.indices.length+' шт.'} — ${money(g.total)}`);
    return J.message({...draft,purpose:draft.method},{itemsText:lines.join('\n\n'),total:money(amountTotal())})+(cart.some(x=>x.packaging)?'\n\nФирменный пакет к каждому подарку — бесплатно.':'');
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
    if(hash==='#request'||hash==='#request-review'){showRequest();return;}
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
  window.CoyliApp={notify,sync:syncPage,request:beginRequest};
  document.querySelectorAll('[data-info="contact"]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();toggleCoyliDrawer(false);beginRequest(null,'advice');},true));
  render();if(location.hash)appRoute();
  let lastSaleActive=CoyliSale.active();
  function refreshSaleBoundary(){
    const active=CoyliSale.active();if(active===lastSaleActive)return;
    lastSaleActive=active;repriceCart();render();
    if(screen==='product')drawProduct(true);
    else if(['cart','checkout','review'].includes(screen))showCart(true);
  }
  setInterval(refreshSaleBoundary,30000);
  window.addEventListener('focus',refreshSaleBoundary);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSaleBoundary();});
})();

