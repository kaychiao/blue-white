import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const cache=resolve(root,'.cache/weather.json');
export function validWeather(data,now=Date.now(),maxAge=3*3600000) {
  const c=data?.current;
  if(!c || !Number.isFinite(c.time) || c.time*1000>now+900000 || now-c.time*1000>maxAge)throw Error('Missing or expired weather');
  for(const field of ['temperature_2m','apparent_temperature','relative_humidity_2m','weather_code','wind_speed_10m'])if(!Number.isFinite(c[field]))throw Error(`Missing ${field}`);
  if(!Array.isArray(data.hourly?.time)||!Array.isArray(data.hourly?.precipitation_probability)||data.hourly.time.length!==data.hourly.precipitation_probability.length)throw Error('Missing hourly forecast');
  return data;
}
export function normalizeQWeather(current, forecast) {
  if (!Array.isArray(forecast.hours) || !forecast.hours.length) throw Error('Missing QWeather hourly data');
  if (current.temperature?.unit !== '°C' || current.feelsLike?.unit !== '°C' || current.wind?.speed?.unit !== 'm/s') throw Error('Unexpected QWeather units');
  if (!Number.isFinite(current.humidity) || current.humidity < 0 || current.humidity > 1) throw Error('Invalid humidity');
  return validWeather({
    source:'qweather',
    attributionURLs:[...new Set([...(current.metadata?.attributions||[]),...(forecast.metadata?.attributions||[])])],
    current:{time:Date.parse(current.validTime)/1000,temperature_2m:current.temperature.value,apparent_temperature:current.feelsLike.value,
      relative_humidity_2m:current.humidity*100,weather_code:-1,condition_text:current.condition?.text||'天气更新中',
      wind_speed_10m:current.wind.speed.value*3.6,has_precipitation:['rain','snow','ice','mixed'].includes(current.precipitation?.type)},
    hourly:{time:forecast.hours.map(h=>Date.parse(h.forecastTime)/1000),precipitation_probability:forecast.hours.map(h=>Number.isFinite(h.precipitation?.probability)?h.precipitation.probability*100:null)}
  });
}
async function fetchQWeather(){
  const host=(process.env.QWEATHER_API_HOST||'').trim();
  if(!/^[a-z0-9.-]+\.qweatherapi\.com$/i.test(host))throw Error('QWeather host must be your assigned domain only');
  const get=async path=>{
    const res=await fetch(`https://${host}${path}`,{headers:{'X-QW-Api-Key':process.env.QWEATHER_API_KEY},signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!res.ok)throw Error(`QWeather HTTP ${res.status}`);
    return res.json();
  };
  const current=await get('/weather/v1/current/31.23/121.47?lang=zh');
  const forecast=await get('/weather/v1/hourly/31.23/121.47?lang=zh&hours=24');
  return normalizeQWeather(current,forecast);
}
async function main(){
  let snapshot=null;
  if(process.env.QWEATHER_API_KEY && process.env.QWEATHER_API_HOST){
    try{snapshot={...await fetchQWeather(),fetchedAt:new Date().toISOString()};console.log('QWeather current + hourly authentication and data checks passed.');}
    catch(error){console.warn(`::warning::QWeather failed: ${error instanceof SyntaxError?'Invalid JSON':error.message.startsWith('QWeather')||error.message.startsWith('Unexpected')||error.message.startsWith('Missing')?error.message:'Connection or response validation failed'}`)}
  }else console.log('QWeather secrets not configured; using Open-Meteo.');
  if(!snapshot){
    const url='https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=2&timezone=Asia%2FShanghai&timeformat=unixtime';
    try{const res=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(`HTTP ${res.status}`);snapshot={...validWeather(await res.json()),source:'open-meteo',fetchedAt:new Date().toISOString()};console.log('Open-Meteo weather fetched.');}
    catch{console.warn('::warning::Open-Meteo fetch failed.');}
  }
  if(snapshot){await mkdir(resolve(root,'.cache'),{recursive:true});await writeFile(cache+'.tmp',JSON.stringify(snapshot));await rename(cache+'.tmp',cache);}
  else{try{snapshot=validWeather(JSON.parse(await readFile(cache,'utf8')),Date.now(),24*3600000);console.log('Using weather cache under 24 hours old; the page labels older observations.')}catch{console.warn('::warning::No valid weather snapshot available.')}}
  await writeFile(resolve(root,'weather-data.js'),`// Public Shanghai weather snapshot.\nwindow.shanghaiWeather = ${JSON.stringify(snapshot).replaceAll('<','\\u003c')};\n`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
