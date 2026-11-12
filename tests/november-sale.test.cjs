const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function setup(now='2026-11-13T12:00:00+07:00'){
 const ctx=vm.createContext({Date:class extends Date{static now(){return Date.parse(now)}},p:catalog,cart:[],catalogLoaded:true,saveCart(){}});
 vm.runInContext(fs.readFileSync(path.join(root,'november-sale.js'),'utf8'),ctx);
 vm.runInContext(html.match(/const sprayL=.*?;/s)[0],ctx);
 vm.runInContext(html.slice(html.indexOf('function formatPrices('),html.indexOf('function availabilityText(')),ctx);
 return ctx;
}
test('Sale starts and ends exactly at Krasnoyarsk midnight',()=>{
 const s=setup().CoyliSale;
 assert.equal(s.active(Date.parse('2026-11-11T16:59:59.999Z')),false);
 assert.equal(s.active(Date.parse('2026-11-11T17:00:00Z')),true);
 assert.equal(s.active(Date.parse('2026-11-15T16:59:59.999Z')),true);
 assert.equal(s.active(Date.parse('2026-11-15T17:00:00Z')),false);
});
test('All perfume volumes use one discount, only on eligible formats',()=>{
 const c=setup();
 for(const x of catalog.filter(x=>['Люкс','Селектив'].includes(x.cat))){
  assert.equal(c.defaultVolume(x),'20');
  for(const [v,n] of Object.entries(c.formatPrices(x,'spray'))){
   assert.equal(c.saleAmount(x,n,v,'spray'),Number(v)>=20?Math.round(n*70)/100:n,`${x.id} spray ${v}`);
  }
  for(const [v,n] of Object.entries(c.formatPrices(x,'oil')))assert.equal(c.saleAmount(x,n,v,'oil'),n,`${x.id} oil ${v}`);
 }
});
test('Original thresholds are 3 ml and 10 ml; 2 ml stays regular',()=>{
 const c=setup();
 for(const x of catalog.filter(x=>x.cat==='Оригинал'))for(const [v,n] of Object.entries(x.price)){
  assert.equal(c.saleAmount(x,n,v),Number(v)>=10?Math.round(n*85)/100:Number(v)>=3?Math.round(n*90)/100:n,`${x.id} ${v}`);
 }
});
test('Fixed prices match the requested price list',()=>{
 const c=setup();
 const expected={'Крем-баттер':{75:400,150:750},'Мисты':{60:800},'Рум-спрей':{100:850,200:1290},'Аромасаше':{75:650},'Свеча':{110:790},'Диффузор':{50:790}};
 for(const x of catalog.filter(x=>expected[x.cat]))for(const v of x.volumes)assert.equal(c.saleAmount(x,x.price[v],v),expected[x.cat][v],`${x.id} ${v}`);
 assert.equal(c.CoyliSale.quote({cat:'Арома-спрей'},1250,80),900);
});
test('Cart reprices saved items during sale and restores ordinary prices after',()=>{
 const c=setup(),lux=catalog.find(x=>x.cat==='Люкс'&&!x.discountPercent),original=catalog.find(x=>x.cat==='Оригинал'&&!x.discountPercent),butter=catalog.find(x=>x.cat==='Крем-баттер');
 c.cart.push({productId:lux.id,vol:'20',format:'Спрей',amount:1800},{name:original.name,cat:original.cat,vol:'10',amount:original.price[10]},{productId:butter.id,vol:'75',amount:499});
 c.repriceCart();assert.equal(c.cart[0].amount,1260);assert.equal(c.cart[1].amount,original.price[10]*.85);assert.equal(c.cart[2].amount,400);
 const after=setup('2026-11-16T00:00:00+07:00');after.cart=c.cart;after.repriceCart();
 assert.equal(after.cart[0].amount,1800);assert.equal(after.cart[1].amount,original.price[10]);assert.equal(after.cart[2].amount,499);assert.equal(after.defaultVolume(lux),'5');
 const oldSale=catalog.find(x=>x.cat==='Селектив'&&x.discountPercent===50);
 assert.equal(after.saleAmount(oldSale,after.formatPrices(oldSale)[20],20),oldSale.saleSprayPrice[20]);
});
