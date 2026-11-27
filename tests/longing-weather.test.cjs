const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function page(file){
 let now=Date.parse('2026-11-27T00:45:00Z'),serial=0;const elements={},events={},timers=new Map(),storage=new Map();
 function el(id){return elements[id]??=( {textContent:'',hidden:false,disabled:false,style:{setProperty(){}},classList:{values:new Set(),add(x){this.values.add(x)},remove(x){this.values.delete(x)}},handlers:{},addEventListener(e,fn){this.handlers[e]=fn},setAttribute(){},replaceChildren(){},append(){},remove(){}})}
 const document={hidden:false,getElementById:el,addEventListener(e,fn){events[e]=fn},createElement:()=>el('script'),head:{append(){}}};
 const c={document,window:{},Intl,Math,Number,URL,location:{protocol:'https:'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id),setInterval(){}};
 return{c,el,document,events,storage,run(){if(file==='longing.js')vm.runInNewContext(fs.readFileSync('assets/js/longing-model.js','utf8'),c);vm.runInNewContext(fs.readFileSync('assets/js/'+file,'utf8'),c)},advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}},set now(n){now=n},get now(){return now}};
}
test('Love note temporarily reveals infinity, restores current time, supports Escape and visibility cancellation',()=>{
 const p=page('longing.js');p.run();const click=()=>p.el('longingSecret').handlers.click();
 click();assert.equal(p.el('longingValue').textContent,'∞');const first=p.el('longingNote').textContent;p.advance(1000);assert.equal(p.el('longingValue').textContent,'∞');p.advance(4200);assert.notEqual(p.el('longingValue').textContent,'∞');assert(Number.isFinite(Number(p.el('longingValue').textContent)));
 click();assert.notEqual(p.el('longingNote').textContent,first);p.el('longingSecret').handlers.keydown({key:'Escape'});assert(!p.el('longing').classList.values.has('is-secret'));
 click();p.document.hidden=true;p.events.visibilitychange();assert(!p.el('longing').classList.values.has('is-secret'));
});
function snapshot(now,age){return{source:'qweather',current:{time:(now-age)/1000,temperature_2m:10,apparent_temperature:9,relative_humidity_2m:89,weather_code:-1,condition_text:'雾',wind_speed_10m:2},hourly:{time:[Math.floor(now/3600000)*3600+3600],precipitation_probability:[70]}}}
test('Delayed observations retain a visible timestamp without presenting old rain or clothing advice as current',()=>{
 const p=page('weather.js');p.c.window.shanghaiWeather=snapshot(p.now,4.5*3600000);p.run();assert.equal(p.el('temperature').textContent,'10°');assert.equal(p.el('humidityCompact').textContent,'89%');assert.equal(p.el('rainCompact').textContent,'—');assert(!p.el('weatherFreshness').hidden);assert.match(p.el('weatherFreshness').textContent,/较早数据/);assert.match(p.el('clothing').textContent,/观测较早/);
});
test('Recent observations keep forecast details; future and day-old observations are rejected',()=>{
 const p=page('weather.js');p.c.window.shanghaiWeather=snapshot(p.now,15*60000);p.run();assert.equal(p.el('rainCompact').textContent,'70%');assert(p.el('weatherFreshness').hidden);
 for(const age of [25*3600000,-20*60000]){const q=page('weather.js');q.c.window.shanghaiWeather=snapshot(q.now,age);q.run();assert.equal(q.el('temperature').textContent,'')}
});
test('Publisher requires fresh API observations but permits a labeled cache no older than one day',async()=>{
 const {validWeather}=await import('../scripts/fetch-weather.mjs');const now=Date.now(),data=snapshot(now,4*3600000);assert.throws(()=>validWeather(data,now));assert.equal(validWeather(data,now,24*3600000),data);assert.throws(()=>validWeather(snapshot(now,25*3600000),now,24*3600000));
});

test('Returning after fifteen seconds adds a reunion note; brief switches do not replay it',()=>{
 const p=page('longing.js');p.run();p.document.hidden=true;p.events.visibilitychange();p.advance(16000);p.document.hidden=false;p.events.visibilitychange();assert.match(p.el('longingNote').textContent,/你一回来/);
 p.advance(25000);assert.doesNotMatch(p.el('longingNote').textContent,/你一回来/);
 p.document.hidden=true;p.events.visibilitychange();p.advance(1000);p.document.hidden=false;p.events.visibilitychange();assert.doesNotMatch(p.el('longingNote').textContent,/你一回来/);
});

test('Live weather runs on opening, throttles quick tab returns, refreshes manually and retains newest data on failure',async()=>{
 const p=page('weather.js');let calls=0,failed=false;
 p.c.AbortController=AbortController;p.c.window.weatherConfig={endpoint:'https://weather.example/weather'};
 p.c.window.shanghaiWeather=snapshot(p.now,4*3600000);
 p.c.fetch=async (url,options)=>{calls++;assert.equal(url,'https://weather.example/weather');assert.equal(options.credentials,'omit');if(failed)throw Error('offline');const data=snapshot(p.now,5*60000);data.current.temperature_2m=18;return{ok:true,json:async()=>data}};
 p.run();const settle=()=>new Promise(resolve=>setImmediate(resolve));await settle();
 assert.equal(calls,1);assert.equal(p.el('temperature').textContent,'18°');assert.match(p.el('weatherStatus').textContent,/已查询和风/);
 p.events.visibilitychange();await settle();assert.equal(calls,1);
 p.advance(61000);p.events.visibilitychange();await settle();assert.equal(calls,2);
 await p.el('weatherRefresh').handlers.click();assert.equal(calls,3);
 failed=true;await p.el('weatherRefresh').handlers.click();assert.equal(calls,4);assert.equal(p.el('temperature').textContent,'18°');assert.match(p.el('weatherStatus').textContent,/实时连接暂不可用/);
});
