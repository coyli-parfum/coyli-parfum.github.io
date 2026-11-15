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
].map(d=>({...d,image:art+d.id+(d.id==='bow'?'-refined':(['heart','gift'].includes(d.id)?'-full':''))+'.webp'}));
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const MIN_AMOUNT=1000,MAX_AMOUNT=50000;
const validAmount=n=>Number.isSafeInteger(n)&&n>=MIN_AMOUNT&&n<=MAX_AMOUNT;
function parseAmount(value){const s=String(value).trim().replace(/[ \u00a0\u202f]/g,'');return /^\d{4,5}$/.test(s)&&validAmount(Number(s))?Number(s):null;}
function wheelAmounts(custom){const values=Array.from({length:50},(_,i)=>(i+1)*1000);if(validAmount(custom)&&!values.includes(custom))values.push(custom);return values.sort((a,b)=>a-b);}
const messengerLabels={telegram:'Telegram',whatsapp:'WhatsApp'};
function normaliseContact(value,messenger){
 const raw=String(value||'').trim();
 if(!Object.hasOwn(messengerLabels,messenger))return null;
 if(messenger==='telegram'){
  const username=raw.replace(/^https?:\/\/t\.me\//i,'').replace(/^@/,'').replace(/\/$/,'');
  if(/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username))return '@'+username;
 }
 if(!/^\+?[\d ()-]+$/.test(raw))return null;
 let digits=raw.replace(/\D/g,'');
 if(digits.length===11&&digits.startsWith('8'))digits='7'+digits.slice(1);
 if(digits.length===10&&!raw.startsWith('+'))digits='7'+digits;
 if(!/^[1-9]\d{7,14}$/.test(digits)||(digits.startsWith('7')&&digits.length!==11))return null;
 if(!raw.startsWith('+')&&!digits.startsWith('7'))return null;
 return '+'+digits;
}
function validateDelivery(s){
 const errors={};
 if(!String(s.recipient||'').trim()||String(s.recipient).trim().length>40)errors.recipient='Укажите имя получателя — до 40 символов.';
 if(!['self','recipient'].includes(s.deliveryTo))errors.deliveryTo='Выберите, кому отправить карту.';
 if(!Object.hasOwn(messengerLabels,s.messenger))errors.messenger='Выберите мессенджер.';
 if(!normaliseContact(s.contact,s.messenger))errors.contact=s.messenger==='telegram'?'Укажите номер с кодом страны или Telegram @username (от 5 символов).':'Укажите номер телефона с кодом страны, например +7 999 123-45-67.';
 if(String(s.sender||'').length>40)errors.sender='Подпись должна быть не длиннее 40 символов.';
 if(String(s.wish||'').length>300)errors.wish='Сократите поздравление до 300 символов.';
 if(String(s.deliveryNote||'').length>200)errors.deliveryNote='Сократите комментарий до 200 символов.';
 return errors;
}
function summary(s){
 const d=designs.find(d=>d.id===s.design);
 if(!validAmount(s.amount)||!d||!['electronic','physical'].includes(s.format)||(s.format==='physical'&&![1500,3000,5000].includes(s.amount)))throw new Error('Invalid gift selection');
 if(s.format==='physical')return 'Здравствуйте! Хочу оформить подарочную карту COYLI PARFUM.\n\nФормат: пластиковая на фирменной подложке\nСумма: '+money(s.amount)+'\n\nПодскажите, пожалуйста, как оплатить и получить карту.';
 if(Object.keys(validateDelivery(s)).length)throw new Error('Incomplete gift delivery');
 return 'ПОДАРОЧНАЯ КАРТА COYLI PARFUM\n\nФормат: электронная\nНоминал: '+money(s.amount)+'\nДизайн: '+d.label+'\nПолучатель: '+s.recipient.trim()+'\nПодпись на подарке: '+(String(s.sender||'').trim()||'без подписи')+'\n\nПоздравление: '+(String(s.wish||'').trim()||'без поздравления')+'\n\nОтправить карту: '+(s.deliveryTo==='self'?'покупателю — подарю самостоятельно':'получателю напрямую')+'\nМессенджер: '+messengerLabels[s.messenger]+'\nКонтакт для отправки: '+normaliseContact(s.contact,s.messenger)+(String(s.deliveryNote||'').trim()?'\nКомментарий к отправке: '+s.deliveryNote.trim():'')+'\nОтправка: после подтверждения оплаты\n\nЗаказ заполнен. Пришлите, пожалуйста, данные для оплаты.';
}
const api={designs,money,validAmount,parseAmount,wheelAmounts,normaliseContact,validateDelivery,messengerLabels,summary,MIN_AMOUNT,MAX_AMOUNT};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CoyliGiftCards=api;
})(typeof window!=='undefined'?window:globalThis);
