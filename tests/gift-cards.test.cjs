const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const M=require('../gift-card-model.js');
const delivery={recipient:'Алёна',deliveryTo:'recipient',messenger:'telegram',contact:'@alena_test'};
const W=require('../gift-wishes.js');
test('all approved and classic designs have an actual local template',()=>{assert.equal(M.designs.length,10);assert.equal(new Set(M.designs.map(x=>x.id)).size,10);for(const d of M.designs)assert.ok(fs.statSync(path.join(__dirname,'..',d.image)).size>1000);});
test('custom amounts reject ambiguous, invalid and unsafe input',()=>{assert.equal(M.parseAmount('6 000'),6000);assert.equal(M.parseAmount('1500'),1500);for(const s of ['', '0', '-100', '1.5', '1,5', '1e3', '500 руб', '99999999'])assert.equal(M.parseAmount(s),null,s);});
test('each selected design, amount and complete multiline greeting reach the request',()=>{for(const d of M.designs){const text=M.summary({...delivery,format:'electronic',design:d.id,amount:6700,wish:'Алёна!\nС любовью'});assert.ok(text.includes(d.label));assert.match(text,/6\s700 ₽/);assert.ok(text.includes('Алёна!\nС любовью'));assert.ok(!text.includes('Номер:'));}});
test('physical orders retain their format and do not inherit electronic greeting',()=>{const t=M.summary({format:'physical',design:'rug',amount:5000,wish:'hello'});assert.match(t,/пластиковая/);assert.ok(!t.includes('Ковёр'));assert.ok(!t.includes('hello'));});

test('electronic amounts include both boundaries and exact custom values',()=>{for(const n of [1000,1001,1500,2600,49999,50000])assert.equal(M.parseAmount(String(n)),n);for(const s of ['999','50001','2600.00','2,600','2\n600','Infinity'])assert.equal(M.parseAmount(s),null,s);});
test('wheel has every thousand and keeps a custom amount without rounding',()=>{const standard=M.wheelAmounts();assert.equal(standard.length,50);assert.equal(standard[0],1000);assert.equal(standard.at(-1),50000);const custom=M.wheelAmounts(2600);assert.equal(custom.length,51);assert.deepEqual(custom.slice(0,4),[1000,2000,2600,3000]);assert.equal(M.wheelAmounts(50000).length,50);assert.equal(M.wheelAmounts(999).length,50);});
test('recipient, sender and personal message reach the manager unchanged',()=>{const text=M.summary({...delivery,format:'electronic',amount:2600,design:'blanket',recipient:'Алёна',sender:'Коллеги',wish:'Для тебя!\nС любовью <3'});for(const word of ['Теплее слов','Алёна','Коллеги','Для тебя!\nС любовью <3'])assert.ok(text.includes(word));assert.match(text,/2\s600 ₽/);});
test('invalid electronic and unavailable physical amounts cannot be ordered',()=>{for(const amount of [999,50001,2.5,null])assert.throws(()=>M.summary({format:'electronic',design:'hug',amount}));assert.throws(()=>M.summary({format:'physical',design:'hug',amount:2600}));});


test('greeting collection covers the requested relationships and fits the message field',()=>{
 for(const id of ['universal','colleagues','friend_f','girlfriend','mom','teacher','friend_m','brother','sister'])assert.ok(W.some(g=>g.id===id),id);
 const wishes=W.flatMap(g=>g.items);assert.equal(wishes.length,30);assert.equal(new Set(wishes.map(w=>w.id)).size,30);
 for(const w of wishes){assert.ok(w.title.trim());assert.ok(w.text.length>30&&w.text.length<=300,w.id);}
});
test('delivery contacts accept common phone formats and Telegram usernames',()=>{
 for(const number of ['8 (999) 123-45-67','79991234567','9991234567','+7 999 123-45-67'])assert.equal(M.normaliseContact(number,'whatsapp'),'+79991234567');
 assert.equal(M.normaliseContact('+31 6 1234 5678','telegram'),'+31612345678');
 for(const username of ['alena_test','@alena_test','https://t.me/alena_test/'])assert.equal(M.normaliseContact(username,'telegram'),'@alena_test');
 for(const bad of ['@a','https://example.com/alena_test','+7 999','8 999 123 45 67 доб 1','++79991234567','7+9991234567'])assert.equal(M.normaliseContact(bad,'telegram'),null,bad);
 assert.equal(M.normaliseContact('@alena_test','whatsapp'),null);
});
test('a complete order requires a named recipient, destination and usable contact',()=>{
 assert.deepEqual(M.validateDelivery(delivery),{});
 const state={...delivery,format:'electronic',design:'rug',amount:2600};
 for(const changes of [{recipient:''},{recipient:'   '},{contact:''},{contact:'123'},{deliveryTo:'unknown'},{messenger:'other'},{sender:'x'.repeat(41)},{wish:'x'.repeat(301)},{deliveryNote:'x'.repeat(201)}])assert.throws(()=>M.summary({...state,...changes}),/Incomplete gift delivery/);
});
test('self-delivery and direct delivery carry the chosen messenger and exact contact',()=>{
 const state={...delivery,format:'electronic',design:'rug',amount:2600,sender:'Коллеги',wish:'',deliveryNote:'Подарок от отдела'};
 const direct=M.summary(state);assert.match(direct,/получателю напрямую/);assert.match(direct,/Мессенджер: Telegram/);assert.match(direct,/@alena_test/);assert.match(direct,/без поздравления/);assert.match(direct,/Подарок от отдела/);assert.match(direct,/после подтверждения оплаты/);assert.ok(!direct.includes('как оплатить и получить'));
 const self=M.summary({...state,deliveryTo:'self',messenger:'whatsapp',contact:'8 999 123-45-67'});assert.match(self,/покупателю/);assert.match(self,/WhatsApp/);assert.match(self,/Контакт для отправки: \+79991234567/);assert.ok(!self.includes('@alena_test'));
});
test('maximum supported order fits the Telegram handoff and survives URL encoding',()=>{
 const state={...delivery,format:'electronic',design:'blanket',amount:50000,recipient:'Я'.repeat(40),sender:'Ю'.repeat(40),wish:'А'.repeat(300),deliveryNote:'Б'.repeat(200)};
 const text=M.summary(state),url=new URL('https://t.me/coyli_parfum?text='+encodeURIComponent(text));assert.equal(url.searchParams.get('text'),text);assert.ok(text.length<3800);assert.ok(url.href.length<14000);
});
