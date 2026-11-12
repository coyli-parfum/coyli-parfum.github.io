/* November 12–15, 2026, inclusive in Krasnoyarsk (UTC+7). */
(function(root){
  'use strict';
  const startsAt=Date.parse('2026-11-12T00:00:00+07:00');
  const endsAt=Date.parse('2026-11-16T00:00:00+07:00');
  const fixed={
    'Крем-баттер':{75:400,150:750},
    'Мисты':{60:800},
    'Арома-спрей':{60:800,80:900},
    'Рум-спрей':{100:850,200:1290},
    'Аромасаше':{75:650},
    'Свеча':{110:790},
    'Диффузор':{50:790}
  };
  const active=(now=Date.now())=>now>=startsAt&&now<endsAt;
  const perfume=item=>['Люкс','Селектив'].includes(item.cat);
  const covered=item=>perfume(item)||item.cat==='Оригинал'||Object.hasOwn(fixed,item.cat);
  function quote(item,regular,volume,format='spray',now=Date.now()){
    if(!active(now)||!covered(item))return null;
    if(!(Number(regular)>0))return regular;
    const v=Number(volume);
    if(perfume(item)&&(format!=='spray'||v<20))return regular;
    if(item.cat==='Оригинал'&&v<3)return regular;
    const saved=item.novemberSale;
    if(saved&&(!saved.format||saved.format===format)&&Number(saved.price?.[volume])>0)return saved.price[volume];
    if(perfume(item))return Math.round(Number(regular)*70)/100;
    if(item.cat==='Оригинал')return Math.round(Number(regular)*(v>=10?85:90))/100;
    return fixed[item.cat]?.[volume]??regular;
  }
  function defaultVolume(item,now=Date.now()){
    if(active(now)&&perfume(item))return '20';
    if(active(now)&&item.cat==='Оригинал'&&item.volumes.some(v=>Number(v)===3))return '3';
    return String(item.kind==='perfume'?5:item.volumes[0]);
  }
  root.CoyliSale={startsAt,endsAt,active,covered,quote,defaultVolume,
    terms:'12–15 ноября: спрей люкс и селектив от 20 мл — −30%; оригиналы от 3 мл — −10%, от 10 мл — −15%. Специальные цены на товары для тела и дома. Скидки не суммируются с бонусами и другими предложениями.'};
})(typeof window==='undefined'?globalThis:window);
