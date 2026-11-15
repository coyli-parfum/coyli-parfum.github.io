/* Public selection only: certificate numbers and balances are not allocated here. */
(function(root){
'use strict';
const art='assets/gifts/electronic/';
const designs=[
{id:'hug',label:'Обнимаю',x:78,y:914,size:78,tone:'thread'},
{id:'love',label:'С любовью',x:78,y:900,size:78},
{id:'bloom',label:'свети и цвети',x:78,y:914,size:78},
{id:'chrome',label:'Твой блеск',x:78,y:903,size:78,tone:'chrome'},
{id:'rug',label:'Как дома',x:165,y:852,size:88,tone:'woven'},
{id:'blanket',label:'Теплее слов',x:105,y:870,size:120,tone:'thread'},
{id:'game',label:'Новый уровень',x:100,y:901,size:56,tone:'green'},
{id:'heart',label:'От всего сердца',x:100,y:890,size:94},
{id:'bow',label:'Особенный момент',x:100,y:890,size:94},
{id:'gift',label:'Маленькое чудо',x:100,y:890,size:94}
].map(d=>({...d,image:art+d.id+(['heart','bow','gift'].includes(d.id)?'-full':'')+'.webp'}));
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const MIN_AMOUNT=1000,MAX_AMOUNT=50000;
const validAmount=n=>Number.isSafeInteger(n)&&n>=MIN_AMOUNT&&n<=MAX_AMOUNT;
function parseAmount(value){const s=String(value).trim().replace(/[ \u00a0\u202f]/g,'');return /^\d{4,5}$/.test(s)&&validAmount(Number(s))?Number(s):null;}
function wheelAmounts(custom){const values=Array.from({length:50},(_,i)=>(i+1)*1000);if(validAmount(custom)&&!values.includes(custom))values.push(custom);return values.sort((a,b)=>a-b);}
function summary(s){
 const d=designs.find(d=>d.id===s.design);
 if(!validAmount(s.amount)||!d||!['electronic','physical'].includes(s.format)||(s.format==='physical'&&![1500,3000,5000].includes(s.amount)))throw new Error('Invalid gift selection');
 const detail=s.format==='electronic'?'\nДизайн: '+d.label+(String(s.recipient||'').trim()?'\nКому: '+String(s.recipient).trim():'')+(String(s.sender||'').trim()?'\nОт кого: '+String(s.sender).trim():'')+(String(s.wish||'').trim()?'\nПоздравление: '+String(s.wish).trim():''):'';
 return 'Здравствуйте! Хочу оформить подарочную карту COYLI PARFUM.\n\nФормат: '+(s.format==='electronic'?'электронная':'пластиковая на фирменной подложке')+'\nСумма: '+money(s.amount)+detail+'\n\nПодскажите, пожалуйста, как оплатить и получить карту.';
}
const api={designs,money,validAmount,parseAmount,wheelAmounts,summary,MIN_AMOUNT,MAX_AMOUNT};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CoyliGiftCards=api;
})(typeof window!=='undefined'?window:globalThis);
