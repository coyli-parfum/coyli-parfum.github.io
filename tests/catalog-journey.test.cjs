const test=require('node:test');
const assert=require('node:assert/strict');
const J=require('../catalog-journey.js');
const catalog=require('../catalog.json');
const product={name:'Лимонное безе',cat:'Крем-баттер',vol:150,quantity:1};

test('Every merchandise category belongs to exactly one primary section',()=>{
  for(const cat of new Set(catalog.map(x=>x.cat).filter(c=>c!=='Флаконы'))){
    assert.equal(J.sections.filter(section=>J.matches({cat},section)).length,1,cat);
  }
  assert.equal(J.matches({cat:'Оригинал'},'Масляная парфюмерия'),false);
  assert.match(J.type('Люкс'),/аналог/);
  assert.match(J.type('Селектив'),/Масляная/);
  assert.match(J.type('Оригинал'),/Оригинальная/);
});
test('Availability requires a real branch; originals use Newton',()=>{
  assert.equal(J.validate({purpose:'availability'},{product:true}).field,'branch');
  assert.equal(J.validate({purpose:'availability',branch:'Квант'},{product:true}),null);
  assert.equal(J.validate({purpose:'availability',branch:'Квант'},{product:true,original:true}).field,'branch');
  assert.equal(J.validate({purpose:'availability',branch:'Ньютон'},{product:true,original:true}),null);
});
test('Delivery requires city, while general enquiries require a product description',()=>{
  assert.equal(J.validate({purpose:'delivery',city:'   '},{product:true}).field,'city');
  assert.equal(J.validate({purpose:'delivery',city:'Красноярск'}).field,'comment');
  assert.equal(J.validate({purpose:'delivery',city:'Красноярск',comment:'Нужен мист'}),null);
  for(const purpose of ['advice','question'])assert.equal(J.validate({purpose}).field,'comment');
});
test('Branch enquiry preserves exact product volume and excludes stale delivery fields',()=>{
  const text=J.message({purpose:'availability',branch:'Квант',city:'Москва'},{product});
  assert.match(text,/150 мл · 1 шт\./);assert.match(text,/ТК «Квант»/);
  assert.doesNotMatch(text,/Москва|доставка/);assert.ok(text.includes('\n\n'));
});
test('Changing to delivery never carries the selected branch into the message',()=>{
  const text=J.message({purpose:'delivery',branch:'Квант',city:' Красноярск ',district:'Центр'},{product});
  assert.match(text,/Город: Красноярск\nРайон: Центр/);
  assert.doesNotMatch(text,/Квант|Филиал:/);
  assert.match(text,/стоимость и срок доставки/);
});
test('Pickup asks for confirmation and includes a planned visit',()=>{
  const text=J.message({purpose:'pickup',branch:'Городской',visit:'Завтра после 18:00'},{product});
  assert.match(text,/ТЦ «Городской»/);assert.match(text,/Завтра после 18:00/);
  assert.match(text,/ждать подтверждения брони/);
});
test('Full bottle request is separate from selected decant volume and price',()=>{
  const d={purpose:'bottle',method:'delivery',city:'Красноярск',bottleVolume:'50 или 100 мл'};
  const x={name:'Creed Aventus',cat:'Оригинал',vol:3,quantity:1};
  assert.equal(J.validate(d,{product:true,original:true}),null);
  assert.equal(J.validate(d,{product:true}).field,'purpose');
  assert.equal(J.validate({...d,bottleVolume:''},{product:true,original:true}).field,'bottleVolume');
  const text=J.message(d,{product:x});
  assert.match(text,/Оригинальный полноразмерный флакон/);
  assert.match(text,/50 или 100 мл/);assert.doesNotMatch(text,/3 мл|распив|₽/);
});
test('Units and formats stay unambiguous',()=>{
  assert.equal(J.unit({cat:'Аромасаше',vol:75}),'75 г');
  assert.equal(J.unit({cat:'Автопарфюм',vol:'1 шт.'}),'1 шт.');
  assert.match(J.productText({name:'Аромат',cat:'Селектив',vol:10,format:'Чистое масло'}),/Чистое масло · 10 мл/);
});
test('Gift and cart details retain amounts and intent',()=>{
  const gift=J.message({purpose:'pickup',branch:'Квант'},{giftText:'Подарочный сертификат COYLI PARFUM\nСумма: 3 000 ₽'});
  assert.match(gift,/сертификат/);assert.match(gift,/3 000 ₽/);assert.match(gift,/Квант/);
  const cart=J.message({purpose:'delivery',city:'Красноярск'},{itemsText:'1. Мист · 60 мл · 2 шт.',total:'1 980 ₽'});
  assert.match(cart,/2 шт\./);assert.match(cart,/Товары по каталогу: 1 980 ₽/);
});
test('Telegram preserves paragraphs; oversized requests use a safe copy fallback',()=>{
  const text=J.message({purpose:'availability',branch:'Квант'},{product,url:'https://coyli-parfum.github.io/#product-9'});
  const link=J.telegram(text);assert.equal(link.long,false);
  assert.equal(new URL(link.url).searchParams.get('text'),text);
  assert.deepEqual(J.telegram('я'.repeat(4000)),{long:true,url:'https://t.me/coyli_parfum'});
});
