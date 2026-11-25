(() => {
 const list=document.getElementById('restaurantList'),status=document.getElementById('restaurantStatus'),button=document.getElementById('restaurantShuffle');
 const data=window.restaurantData;
 if(!data || Date.now()-Date.parse(data.generatedAt)>86400000 || !Array.isArray(data.places)||!data.places.length){status.textContent='暂时没有可用餐厅数据，稍后更新后再来看看。';button.disabled=true;return}
 const pool=data.places.filter(p=>p.id&&p.name);let previous=new Set();
 const score=p=>Number.isFinite(p.rating)&&p.rating>0;
 const shuffled=a=>a.map(p=>({p,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.p);
 function show(){
  let choices=pool.filter(p=>!previous.has(p.id));if(!choices.length)choices=pool;
  const ordered=[...shuffled(choices.filter(p=>p.sichuan&&score(p))),...shuffled(choices.filter(p=>!p.sichuan&&score(p))),...shuffled(choices.filter(p=>!score(p)))];
  const selected=ordered.slice(0,3);previous=new Set(selected.map(p=>p.id));list.replaceChildren();
  for(const p of selected){
   const card=document.createElement('article');card.className='restaurant-card';
   const tag=document.createElement('span');tag.className='restaurant-tag';tag.textContent=p.sichuan?'川菜优先':'换个口味';
   const title=document.createElement('h3');title.textContent=p.name;
   const stats=document.createElement('p');stats.className='restaurant-stats';stats.textContent=`${score(p)?'高德 '+p.rating+' 分':'暂无评分'} · ${Number.isFinite(p.cost)&&p.cost>0?'人均 ¥'+p.cost:'人均暂无'}`;
   const reason=document.createElement('p');reason.className='restaurant-reason';reason.textContent=p.sichuan?'按你喜欢的川菜口味，先看看这家。':'上海固定测试点周边的一家备选，想换口味时可以看看。';
   const address=document.createElement('p');address.className='restaurant-address';address.textContent=p.address||'地址请查看地图';
   const link=document.createElement('a');const url=new URL('https://uri.amap.com/marker');url.search=new URLSearchParams({poiid:p.id,src:'blue-white',callnative:'0'}).toString();link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='在高德查看 ↗';
   card.append(tag,title,stats,reason,address);if(p.hours){const hours=document.createElement('p');hours.className='restaurant-hours';hours.textContent='营业时间参考：'+p.hours;card.append(hours)}card.append(link);list.append(card);
  }
  const stamp=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(data.generatedAt));
  status.textContent=`${stamp} 更新 · 上海固定测试点 3 公里内 · 高德数据 · 未使用你的定位`;
  button.disabled=pool.length<=selected.length;
 }
 button.addEventListener('click',show);show();
})();
