/* Shared catalog taxonomy and message drafts. No requests are sent by this module. */
(function(root){
  'use strict';
  const sections=['Оригинал','Масляная парфюмерия','Для тела','Для дома','Автопарфюм','Подарочные карты'];
  const children={'Масляная парфюмерия':['Селектив','Люкс'],'Для тела':['Крем-баттер','Мисты'],'Для дома':['Диффузор','Свеча','Рум-спрей','Аромасаше']};
  const labels={'Оригинал':'Оригинальные ароматы','Подарочные карты':'Подарочные сертификаты','Крем-баттер':'Крем-баттеры','Диффузор':'Диффузоры','Селектив':'Селектив · аналоги','Люкс':'Люкс · аналоги','Свеча':'Свечи','Рум-спрей':'Рум-спреи','Автопарфюм':'Для авто'};
  const descriptions={'Оригинал':'Оригинальная парфюмерия на распив. Полноразмерный флакон — по запросу.','Масляная парфюмерия':'Аналоги ароматов на масляной основе. Два формата: чистое масло и спрей. Селектив и люкс — категории этой линейки, не оригинальные ароматы.','Для тела':'Крем-баттеры и мисты.','Для дома':'Диффузоры, свечи, рум-спреи и аромасаше.','Автопарфюм':'Ароматы для автомобиля.','Подарочные карты':'Подарок, который можно выбрать самому.'};
  const branches=['Ньютон','Квант','Городской'];
  const purposes=[['availability','Наличие в филиале','Узнать, есть ли нужный товар'],['pickup','Самовывоз / бронь','Попросить отложить до визита'],['delivery','Заказ с доставкой','Уточнить получение в своём городе'],['advice','Помощь с выбором','Для себя или в подарок'],['question','Вопрос о товаре','Состав, формат, применение'],['bottle','Оригинальный флакон','Уточнить цену и привоз под заказ']];
  const label=c=>labels[c]||c;
  const parent=c=>sections.includes(c)?c:Object.keys(children).find(k=>children[k].includes(c))||c;
  const type=c=>c==='Оригинал'?'Оригинальная парфюмерия · распив':['Селектив','Люкс'].includes(c)?'Масляная парфюмерия · аналог · '+c:label(c);
  const matches=(item,c)=>children[c]?children[c].includes(item.cat):item.cat===c;
  const unit=x=>String(x.vol)+(/[^\d.,\s]/.test(String(x.vol))?'':x.cat==='Аромасаше'?' г':' мл');
  function productText(x){return [x.name,type(x.cat),[x.format,unit(x),x.quantity?x.quantity+' шт.':''].filter(Boolean).join(' · ')].join('\n');}
  function validate(d,{original=false,product=false}={}){
    if(!purposes.some(([id])=>id===d.purpose))return {field:'purpose',message:'Выберите цель обращения.'};
    if(d.purpose==='bottle'&&!original)return {field:'purpose',message:'Выберите оригинальный аромат для запроса флакона.'};
    const pickup=['availability','pickup'].includes(d.purpose)||(d.purpose==='bottle'&&d.method==='pickup');
    const delivery=d.purpose==='delivery'||(d.purpose==='bottle'&&d.method==='delivery');
    if(pickup&&!branches.includes(d.branch))return {field:'branch',message:'Выберите филиал.'};
    if(pickup&&original&&d.branch!=='Ньютон')return {field:'branch',message:'Оригинальные ароматы представлены в ТК «Ньютон».'};
    if(delivery&&!String(d.city||'').trim())return {field:'city',message:'Укажите город доставки.'};
    if(d.purpose==='bottle'&&!String(d.bottleVolume||'').trim())return {field:'bottleVolume',message:'Укажите желаемый объём флакона.'};
    if(d.purpose==='bottle'&&!['pickup','delivery'].includes(d.method))return {field:'method',message:'Выберите способ получения.'};
    if(['question','advice'].includes(d.purpose)&&!String(d.comment||'').trim())return {field:'comment',message:d.purpose==='advice'?'Расскажите, что хотите подобрать.':'Напишите ваш вопрос.'};
    if(!product&&['availability','pickup','delivery'].includes(d.purpose)&&!String(d.comment||'').trim())return {field:'comment',message:'Напишите, какой товар вас интересует.'};
    return null;
  }
  function message(d,context={}){
    const opening={availability:'Хочу уточнить наличие в вашем филиале.',pickup:'Хочу забрать покупку в магазине и уточнить возможность брони.',delivery:'Хочу оформить заказ с доставкой.',advice:'Помогите, пожалуйста, с выбором.',question:'Хочу уточнить информацию о товаре.',bottle:'Хочу узнать о заказе оригинального полноразмерного флакона.'};
    const closing={availability:'Подскажите, пожалуйста, есть ли этот товар в выбранном филиале в нужном объёме.',pickup:'Подтвердите, пожалуйста, наличие и возможность отложить покупку. Буду ждать подтверждения брони.',delivery:'Подскажите, пожалуйста, наличие, стоимость и срок доставки, итоговую сумму и способ оплаты.',advice:'Подскажите, пожалуйста, какие варианты подойдут под мои пожелания.',question:'Подскажите, пожалуйста, по моему вопросу.',bottle:'Подскажите, пожалуйста, доступные объёмы, стоимость, срок привоза и условия предоплаты.'};
    const parts=['Здравствуйте!\n'+opening[d.purpose]];
    if(context.product)parts.push(d.purpose==='bottle'?context.product.name+'\nОригинальный полноразмерный флакон\nЖелаемый объём: '+String(d.bottleVolume).trim():productText(context.product));
    if(context.itemsText)parts.push(context.itemsText);
    if(context.giftText)parts.push(context.giftText);
    if(context.total)parts.push('Товары по каталогу: '+context.total);
    if(['availability','pickup'].includes(d.purpose)||(d.purpose==='bottle'&&d.method==='pickup'))parts.push((d.purpose==='availability'?'Филиал: ':'Получение: самовывоз\nФилиал: ')+(d.branch==='Городской'?'ТЦ':'ТК')+' «'+d.branch+'»'+(d.purpose==='pickup'&&d.visit?'\nПланирую забрать: '+d.visit:''));
    if(d.purpose==='delivery'||(d.purpose==='bottle'&&d.method==='delivery'))parts.push('Получение: доставка\nГород: '+String(d.city||'').trim()+(d.district?'\nРайон: '+d.district:'')+(d.deliveryWay?'\nПожелание по доставке: '+d.deliveryWay:''));
    if(d.name)parts.push('Меня зовут '+String(d.name).trim()+'.');
    if(d.comment)parts.push((d.purpose==='question'?'Мой вопрос: ':d.purpose==='advice'?'Пожелания: ':'Комментарий: ')+String(d.comment).trim());
    if(context.url)parts.push('Товар в каталоге:\n'+context.url);
    parts.push(context.itemsText&&d.purpose==='availability'?'Подскажите, пожалуйста, есть ли выбранные товары в этом филиале.':closing[d.purpose]);
    return parts.filter(Boolean).join('\n\n');
  }
  function telegram(text){const long=[...text].length>3800||encodeURIComponent(text).length>14000;return {long,url:'https://t.me/coyli_parfum'+(long?'':'?text='+encodeURIComponent(text))};}
  const api={sections,children,descriptions,branches,purposes,label,parent,type,matches,unit,productText,validate,message,telegram};
  root.CoyliJourney=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
