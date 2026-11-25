(() => {
 const $=id=>document.getElementById(id),list=$('restaurantList'),status=$('restaurantStatus'),shuffle=$('restaurantShuffle'),locate=$('restaurantLocate'),form=$('restaurantForm'),input=$('restaurantAddress'),submit=$('restaurantSearch'),candidates=$('restaurantLocations');
 let sdkPromise,pool=[],previous=new Set(),centerLabel='',busy=false;
 const numeric=v=>(typeof v==='string'||typeof v==='number')&&String(v).trim()&&Number.isFinite(Number(v))?Number(v):null;
 function state(message,loading=false){status.textContent=message;busy=loading;locate.disabled=submit.disabled=loading;shuffle.disabled=loading||pool.length<4;list.setAttribute('aria-busy',String(loading));}
 function clearResults(){pool=[];previous.clear();list.replaceChildren();candidates.replaceChildren();shuffle.disabled=true;}
 function sdk(){
  if(sdkPromise)return sdkPromise;
  const config=window.amapBrowserConfig;
  if(!config?.key||!config.securityJsCode)return Promise.reject(Error('附近搜索尚未启用，请稍后再试。'));
  sdkPromise=new Promise((resolve,reject)=>{
   window._AMapSecurityConfig={securityJsCode:config.securityJsCode};
   const script=document.createElement('script');let done=false;
   const timer=setTimeout(()=>finish(Error('地图服务连接超时，请稍后重试。')),15000);
   function finish(error){if(done)return;done=true;clearTimeout(timer);script.onerror=null;script.onload=null;error?reject(error):resolve(window.AMap)}
   const url=new URL('https://webapi.amap.com/maps');url.search=new URLSearchParams({v:'2.0',key:config.key,plugin:'AMap.PlaceSearch'}).toString();script.src=url;
   script.onload=()=>window.AMap?.PlaceSearch?finish():finish(Error('地图服务未能加载，请检查服务配置。'));script.onerror=()=>finish(Error('地图服务无法连接，请稍后重试。'));document.head.append(script);
  }).catch(error=>{sdkPromise=null;throw error});return sdkPromise;
 }
 function search(A,keyword,center){return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('餐厅搜索超时，请稍后再试。')),15000);
  const service=new A.PlaceSearch({pageSize:25,pageIndex:1,extensions:'all',type:'餐饮服务'});
  service.searchNearBy(keyword,center,3000,(code,result)=>{clearTimeout(timer);if(code==='no_data')return resolve([]);if(code!=='complete')return reject(Error('餐厅搜索暂时不可用，请检查地图服务权限后重试。'));resolve(result.poiList?.pois||[])});
 })}
 function normalize(p,sichuan){const b=p.biz_ext||p.business||{};return {id:p.id,name:p.name,address:typeof p.address==='string'?p.address:'',rating:numeric(b.rating??p.rating),cost:numeric(b.cost??p.cost),hours:typeof b.open_time==='string'?b.open_time:typeof b.opentime_today==='string'?b.opentime_today:'',sichuan:sichuan||/川菜|四川菜/.test(p.type||'')};}
 async function nearby(A,center,label){
  state('正在找 3 公里内的川菜和其他餐厅…',true);clearResults();
  const results=await Promise.allSettled([search(A,'川菜',center),search(A,'',center)]);
  const found=new Map();results.forEach((r,i)=>{if(r.status==='fulfilled')for(const p of r.value){if(p.id&&p.name)found.set(p.id,{...normalize(p,i===0),sichuan:i===0||found.get(p.id)?.sichuan||/川菜|四川菜/.test(p.type||'')})}});
  if(results.every(r=>r.status==='rejected'))throw results[0].reason;
  pool=[...found.values()];centerLabel=label;
  if(!pool.length){state('这个位置附近暂时没有找到餐厅，试试另一个地点吧。');return;}
  show(results.some(r=>r.status==='rejected')?'部分搜索未完成 · ':'');
 }
 const shuffled=a=>a.map(p=>({p,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.p);
 function show(prefix=''){
  let choices=pool.filter(p=>!previous.has(p.id));if(choices.length<3)choices=[...choices,...pool.filter(p=>previous.has(p.id))];
  const preferred=choices.filter(p=>p.rating!==null&&p.rating>=4),others=choices.filter(p=>!preferred.includes(p));
  const ordered=[...shuffled(preferred.filter(p=>p.sichuan)),...shuffled(preferred.filter(p=>!p.sichuan)),...shuffled(others.filter(p=>p.sichuan)),...shuffled(others.filter(p=>!p.sichuan))];
  const selected=ordered.slice(0,3);previous=new Set(selected.map(p=>p.id));list.replaceChildren();
  for(const p of selected){
   const card=document.createElement('article');card.className='restaurant-card';
   const text=(tag,cls,value)=>{const el=document.createElement(tag);el.className=cls;el.textContent=value;card.append(el)};
   text('span','restaurant-tag',p.sichuan?'川菜优先':'换个口味');text('h3','',p.name);
   text('p','restaurant-stats',`${p.rating!==null&&p.rating>0?'高德 '+p.rating+' 分':'暂无评分'} · ${p.cost!==null&&p.cost>0?'人均 ¥'+p.cost:'人均暂无'}`);
   text('p','restaurant-reason',p.sichuan?'按你喜欢的川菜口味，先看看这家。':'选定位置周边的另一种口味，想换换时可以看看。');
   text('p','restaurant-address',p.address||'地址请查看地图');if(p.hours)text('p','restaurant-hours','营业时间参考：'+p.hours);
   const link=document.createElement('a'),url=new URL('https://uri.amap.com/marker');url.search=new URLSearchParams({poiid:p.id,src:'blue-white',callnative:'0'}).toString();link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='在高德查看 ↗';card.append(link);list.append(card);
  }
  state(`${prefix}${centerLabel} · 3 公里内 · 高德数据 · ${pool.length} 家候选`);
 }
 locate.addEventListener('click',async()=>{
  if(busy)return;clearResults();state('正在准备定位…',true);
  try{
   if(!navigator.geolocation)throw Error('浏览器不支持定位，请输入地点。');
   const A=await sdk();state('请允许浏览器获取位置；也可以取消并输入地点。',true);
   const coords=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve(p.coords),e=>reject(Error(e.code===1?'你未授权定位，请输入商圈、地铁站或地址。':'定位未成功，请重试或输入地点。')),{enableHighAccuracy:true,timeout:12000,maximumAge:60000}));
   const point=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('位置转换超时，请输入地点。')),12000);A.convertFrom([coords.longitude,coords.latitude],'gps',(code,result)=>{clearTimeout(timer);code==='complete'&&result.locations?.length?resolve(result.locations[0]):reject(Error('位置转换失败，请输入地点。'))})});
   const accuracy=Number.isFinite(coords.accuracy)&&coords.accuracy>500?'（定位精度较低，建议输入地点）':'';
   await nearby(A,point,'浏览器当前位置'+accuracy);
  }catch(error){state(error.message);input.focus();}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const query=input.value.trim();if(!query){state('请输入城市和商圈、地铁站或地址。');input.focus();return}
  clearResults();state('正在查找你输入的地点…',true);
  try{
   const A=await sdk();const places=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('地点查询超时，请稍后重试。')),15000);new A.PlaceSearch({pageSize:5,pageIndex:1}).search(query,(code,result)=>{clearTimeout(timer);code==='complete'?resolve(result.poiList?.pois||[]):code==='no_data'?resolve([]):reject(Error('地点查询失败，请检查输入或稍后再试。'))})});
   if(!places.length){state('没有找到这个地点，试试加上城市名称。');return}
   state('请选择具体地点，再为你找附近餐厅。');
   for(const p of places.filter(p=>p.location)){
    const button=document.createElement('button');button.type='button';button.className='place-option';button.textContent=[p.name,p.cityname,p.adname,typeof p.address==='string'?p.address:''].filter(Boolean).join(' · ');
    button.addEventListener('click',async()=>{if(busy)return;try{await nearby(A,p.location,p.name)}catch(error){state(error.message)}});candidates.append(button);
   }
   if(!candidates.children.length)state('这个地点没有有效坐标，请换一个更具体的地点。');
  }catch(error){state(error.message);}
 });
 shuffle.addEventListener('click',()=>{if(!busy)show()});
 state(window.amapBrowserConfig?.key?'选择当前位置，或输入想去的地点。':'附近搜索尚未启用，等待配置高德 JS API。');
})();
