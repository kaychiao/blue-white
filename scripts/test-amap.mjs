import https from 'node:https';
import {appendFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function numeric(value){if(typeof value!=='string' && typeof value!=='number')return null;if(String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
export function restaurant(poi){const b=poi.business||{};return {id:typeof poi.id==='string'?poi.id:'',location:typeof poi.location==='string'?poi.location:'',address:typeof poi.address==='string'?poi.address:'',type:typeof poi.type==='string'?poi.type:'',name:typeof poi.name==='string'?poi.name:'未命名餐厅',rating:numeric(b.rating),cost:numeric(b.cost),hours:typeof b.opentime_today==='string'?b.opentime_today:typeof b.opentime_week==='string'?b.opentime_week:null};}
function requestIPv4(url){
 return new Promise((resolve,reject)=>{
  const req=https.get(url,{family:4,signal:AbortSignal.timeout(15000)},res=>{
   let body='';res.setEncoding('utf8');res.on('data',part=>body+=part);res.on('error',reject);res.on('end',()=>resolve({ok:res.statusCode>=200&&res.statusCode<300,status:res.statusCode,headers:{get:name=>res.headers[name]},json:async()=>JSON.parse(body)}));
  });req.on('error',reject);
 });
}
async function main(){
 if(!process.env.AMAP_API_KEY){console.error('::error::Missing AMAP_API_KEY repository secret.');process.exitCode=1;return}
 const rows=[],pool=new Map();
 try{
  for(const keywords of ['川菜','']){
   const url=new URL('https://restapi.amap.com/v5/place/around');
   url.search=new URLSearchParams({key:process.env.AMAP_API_KEY,location:'121.4737,31.2304',radius:'3000',types:'050000',keywords,show_fields:'business',page_size:'25',page_num:'1',sortrule:'weight'}).toString();
   let response;
   for(let attempt=1;attempt<=2;attempt++){
    try{response=await requestIPv4(url);break}
    catch(error){const code=error.name==='TimeoutError'?'TIMEOUT':String(error.cause?.code||error.code||'NETWORK').replace(/[^A-Z0-9_]/g,'');console.log(`AMap connection attempt ${attempt}: ${code}`);if(attempt===2)throw Error(`Connection ${code}`)}
   }
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const type=response.headers.get('content-type')||'';if(!type.includes('json'))throw Error('Invalid POI response');
   const data=await response.json();
   if(data.status!=='1')throw Error(`AMap code ${String(data.infocode||'unknown').replace(/[^0-9A-Za-z_-]/g,'')}`);
   if(!Array.isArray(data.pois))throw Error('Invalid POI response');
   const places=data.pois.map(restaurant);
   for(const p of places){if(p.id){const old=pool.get(p.id);pool.set(p.id,{...p,sichuan:keywords==='川菜'||old?.sichuan||/川菜|四川菜/.test(p.type)})}}
   const rated=places.filter(p=>p.rating!==null&&p.rating>0).sort((a,b)=>b.rating-a.rating);
   console.log(JSON.stringify({query:keywords||'全部餐饮',returned:places.length,withRating:rated.length,withCost:places.filter(p=>p.cost!==null).length,withHours:places.filter(p=>p.hours).length}));
   rows.push(`### ${keywords||'全部餐饮'}\n返回 ${places.length} 家，评分 ${rated.length} 家，人均 ${places.filter(p=>p.cost!==null).length} 家，营业时间 ${places.filter(p=>p.hours).length} 家。\n`);
   for(const p of rated.slice(0,3))rows.push(`- ${p.name.replace(/[<>\n\r]/g,' ')}：高德评分 ${p.rating}，人均 ${p.cost===null?'暂无':p.cost+' 元'}；营业时间 ${p.hours?p.hours.replace(/[<>\n\r]/g,' '):'暂无'}\n`);
  }
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'## 高德餐厅接口实测\n固定测试位置：上海市中心，半径 3 公里。不是访客定位推荐。\n'+rows.join('\n'));
  if(process.env.AMAP_PUBLISH==='1'){
   const data={generatedAt:new Date().toISOString(),center:{name:'上海市中心固定测试点',location:'121.4737,31.2304',radius:3000},places:[...pool.values()]};
   await writeFile(new URL('../data/restaurant-data.js',import.meta.url),`// Public restaurant preview; contains no API credentials.\nwindow.restaurantData = ${JSON.stringify(data).replaceAll('<','\\u003c')};\n`);
  }
  console.log('AMap authentication and both nearby searches passed.');
 }catch(error){const safe=/^(HTTP \d+|AMap code [0-9A-Za-z_-]+|Invalid POI response|Connection [A-Z0-9_]+)$/.test(error.message)?error.message:'Connection timeout or response parsing failed';console.error(`::error::${safe}`);process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
