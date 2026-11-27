// Fixed Shanghai weather proxy. Credentials stay in Cloudflare Secrets.
export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url),origin=request.headers.get('Origin');
    const allowed=(env.ALLOWED_ORIGINS||'https://kaychiao.github.io,http://localhost:8000,http://127.0.0.1:8000').split(',').map(s=>s.trim());
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    if(origin&&allowed.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
    if(origin&&!allowed.includes(origin))return reply({error:'origin_not_allowed'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Max-Age':'86400'}});
    if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
    const host=(env.QWEATHER_API_HOST||'').trim();
    const configured=Boolean(env.QWEATHER_API_KEY&&/^[a-z0-9.-]+\.qweatherapi\.com$/i.test(host));
    if(url.pathname==='/health')return reply({ok:true,service:'blue-white-weather',configured});
    if(url.pathname!=='/weather')return reply({error:'not_found'},404);
    if(!configured)return reply({error:'weather_not_configured'},503);
    // A single location/cache key prevents callers turning this into a general API proxy.
    const key=new Request(new URL('/weather',url.origin)),cache=typeof caches==='undefined'?null:caches.default;
    try{const cached=await cache?.match(key);if(cached){const res=new Response(cached.body,{status:200,headers});res.headers.set('X-Weather-Cache','HIT');return res}}catch{}
    try{
      const get=async path=>{
        const phase=path.includes('/current/')?'current':'hourly';let res;
        try{res=await fetch(`https://${host}${path}`,{headers:{'X-QW-Api-Key':env.QWEATHER_API_KEY},signal:AbortSignal.timeout(8000),redirect:'manual'})}
        catch(error){throw Error(`${phase}_transport_${['TypeError','TimeoutError','AbortError'].includes(error?.name)?error.name:'Error'}`)}
        if(!res.ok)throw Error(`${phase}_http_${res.status}`);
        try{return await res.json()}catch{throw Error(`${phase}_json`)}
      };
      const [c,f]=await Promise.all([get('/weather/v1/current/31.23/121.47?lang=zh'),get('/weather/v1/hourly/31.23/121.47?lang=zh&hours=24')]);
      const time=Date.parse(c.validTime)/1000;
      if(!Number.isFinite(time)||Date.now()-time*1000>10800000||time*1000>Date.now()+900000)throw Error('data_time');
      if(c.temperature?.unit!=='°C'||c.feelsLike?.unit!=='°C'||c.wind?.speed?.unit!=='m/s')throw Error('data_units');
      if(![c.temperature.value,c.feelsLike.value,c.wind.speed.value,c.humidity].every(Number.isFinite)||c.humidity<0||c.humidity>1)throw Error('data_current');
      if(!Array.isArray(f.hours)||!f.hours.length)throw Error('forecast_missing');
      const times=f.hours.map(h=>Date.parse(h.forecastTime)/1000);if(!times.every(Number.isFinite))throw Error('forecast');
      const payload={source:'qweather',fetchedAt:new Date().toISOString(),attributionURLs:[...new Set([...(c.metadata?.attributions||[]),...(f.metadata?.attributions||[])])],current:{time,temperature_2m:c.temperature.value,apparent_temperature:c.feelsLike.value,relative_humidity_2m:c.humidity*100,weather_code:-1,condition_text:c.condition?.text||'天气更新中',wind_speed_10m:c.wind.speed.value*3.6,has_precipitation:['rain','snow','ice','mixed'].includes(c.precipitation?.type)},hourly:{time:times,precipitation_probability:f.hours.map(h=>Number.isFinite(h.precipitation?.probability)&&h.precipitation.probability>=0&&h.precipitation.probability<=1?h.precipitation.probability*100:null)}};
      const body=JSON.stringify(payload);
      try{if(cache)ctx.waitUntil(cache.put(key,new Response(body,{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=300'}})).catch(()=>{}))}catch{}
      const response=new Response(body,{headers});response.headers.set('X-Weather-Cache','MISS');return response;
    }catch(error){const reason=/^((current|hourly)_(http_[0-9]{3}|transport_(TypeError|TimeoutError|AbortError|Error)|json)|data_time|data_units|data_current|forecast_missing|forecast)$/.test(error?.message)?error.message:'network';return reply({error:'weather_provider_unavailable',reason},502)}
  }
};
