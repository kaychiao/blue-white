import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const env={QWEATHER_API_HOST:'example.qweatherapi.com',QWEATHER_API_KEY:'test-only-secret'};
const req=(path,options={})=>new Request(`https://weather.test${path}`,options);
test('health, missing configuration, origin and method checks do not contact QWeather',async()=>{
 assert.deepEqual(await (await worker.fetch(req('/health'),{},{})).json(),{ok:true,service:'blue-white-weather',configured:false});
 assert.equal((await worker.fetch(req('/weather'),{},{})).status,503);
 assert.equal((await worker.fetch(req('/weather',{headers:{Origin:'https://bad.test'}}),env,{})).status,403);
 assert.equal((await worker.fetch(req('/weather',{method:'POST'}),env,{})).status,405);
 assert.equal((await worker.fetch(req('/weather'),{...env,QWEATHER_API_HOST:'https://evil.test'},{})).status,503);
});
test('Shanghai live weather uses server credentials, normalizes units and reuses a five-minute cache',async()=>{
 const oldFetch=globalThis.fetch,oldCache=globalThis.caches;let calls=0,stored,fail=false;const tasks=[];
 globalThis.caches={default:{match:async()=>stored?.clone(),put:async(key,res)=>{assert.equal(res.headers.get('Cache-Control'),'public, max-age=300');stored=res}}};
 globalThis.fetch=async (url,options)=>{calls++;assert.equal(options.headers['X-QW-Api-Key'],env.QWEATHER_API_KEY);assert(url.startsWith('https://example.qweatherapi.com/weather/v1/'));assert(url.includes('/31.23/121.47?'));if(fail)throw Error('never expose the credential');return Response.json(url.includes('/current/')?{validTime:new Date().toISOString(),temperature:{unit:'°C',value:13},feelsLike:{unit:'°C',value:12},wind:{speed:{unit:'m/s',value:2}},humidity:.7,condition:{text:'晴'}}:{hours:[{forecastTime:new Date(Date.now()+3600000).toISOString(),precipitation:{probability:.3}}]})};
 try{
  const ctx={waitUntil:p=>tasks.push(p)};
  let res=await worker.fetch(req('/weather?lat=90',{headers:{Origin:'https://kaychiao.github.io'}}),env,ctx);assert.equal(res.status,200);assert.equal(res.headers.get('Access-Control-Allow-Origin'),'https://kaychiao.github.io');const data=await res.json();assert.equal(data.current.relative_humidity_2m,70);assert.equal(data.current.wind_speed_10m,7.2);assert.equal(data.hourly.precipitation_probability[0],30);assert(!JSON.stringify(data).includes(env.QWEATHER_API_KEY));await Promise.all(tasks);
  res=await worker.fetch(req('/weather'),env,ctx);assert.equal(res.headers.get('X-Weather-Cache'),'HIT');assert.equal(res.headers.get('Access-Control-Allow-Origin'),null);assert.equal(calls,2);
  stored=null;fail=true;res=await worker.fetch(req('/weather'),env,ctx);assert.equal(res.status,502);assert.equal((await res.json()).error,'weather_provider_unavailable');
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCache}
});

test('Upstream HTTP failures expose only a safe status code, never response bodies or credentials',async()=>{
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async()=>new Response('private provider response',{status:401});
 try{const res=await worker.fetch(req('/weather'),env,{});const data=await res.json();assert.match(data.reason,/^(current|hourly)_http_401$/);assert(!JSON.stringify(data).includes('private'));assert(!JSON.stringify(data).includes(env.QWEATHER_API_KEY))}finally{globalThis.fetch=oldFetch}
});

test('Synchronous cache write failures never discard successfully fetched weather',async()=>{
 const oldFetch=globalThis.fetch,oldCache=globalThis.caches;
 globalThis.caches={default:{match:async()=>undefined,put(){throw Error('cache disabled')}}};
 globalThis.fetch=async url=>Response.json(url.includes('/current/')?{validTime:new Date().toISOString(),temperature:{unit:'°C',value:17},feelsLike:{unit:'°C',value:15},wind:{speed:{unit:'m/s',value:3}},humidity:.47,condition:{text:'晴'}}:{hours:[{forecastTime:new Date(Date.now()+3600000).toISOString(),precipitation:{probability:0}}]});
 try{const res=await worker.fetch(req('/weather'),env,{waitUntil(){}});assert.equal(res.status,200);assert.equal((await res.json()).current.temperature_2m,17)}finally{globalThis.fetch=oldFetch;globalThis.caches=oldCache}
});
