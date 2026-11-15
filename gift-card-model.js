/* Public selection only: certificate numbers and balances are not allocated here. */
(function(root){
'use strict';
const art='assets/gifts/electronic/';
const designs=[
{id:'hug',label:'Обнимаю',x:78,y:914,size:78},
{id:'love',label:'С любовью',x:78,y:900,size:78},
{id:'bloom',label:'свети и цвети',x:78,y:914,size:78},
{id:'chrome',label:'Хром',x:78,y:903,size:78,tone:'chrome'},
{id:'rug',label:'Ковёр',x:165,y:852,size:88,tone:'woven'},
{id:'game',label:'Игровая',x:100,y:901,size:56,tone:'green'},
{id:'heart',label:'Сердце',x:160,y:813,size:100},
{id:'bow',label:'Бант',x:173,y:789,size:100},
{id:'gift',label:'Подарок',x:160,y:823,size:100}
].map(d=>({...d,image:art+d.id+'.webp'}));
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const validAmount=n=>Number.isSafeInteger(n)&&n>0&&n<=9999999;
function parseAmount(value){const s=String(value).replace(/\s/g,'');return /^\d{1,7}$/.test(s)&&validAmount(Number(s))?Number(s):null;}
function summary(s){
 const d=designs.find(d=>d.id===s.design);
 if(!validAmount(s.amount)||!d||!['electronic','physical'].includes(s.format))throw new Error('Invalid gift selection');
 return 'Здравствуйте! Хочу оформить подарочную карту COYLI PARFUM.\n\nФормат: '+(s.format==='electronic'?'электронная':'пластиковая на фирменной подложке')+'\nСумма: '+money(s.amount)+(s.format==='electronic'?'\nДизайн: '+d.label+(String(s.wish||'').trim()?'\nПоздравление: '+String(s.wish).trim():''):'')+'\n\nПодскажите, пожалуйста, как оплатить и получить карту.';
}
const api={designs,money,validAmount,parseAmount,summary};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CoyliGiftCards=api;
})(typeof window!=='undefined'?window:globalThis);
