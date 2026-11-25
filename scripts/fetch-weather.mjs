import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const cache=resolve(root,'.cache/weather.json');
export function validWeather(data,now=Date.now()) {
  const c=data?.current;
  if(!c || !Number.isFinite(c.time) || c.time*1000>now+900000 || now-c.time*1000>3*3600000)throw Error('Missing or expired weather');
  for(const field of ['temperature_2m','apparent_temperature','relative_humidity_2m','weather_code','wind_speed_10m'])if(!Number.isFinite(c[field]))throw Error(`Missing ${field}`);
  if(!Array.isArray(data.hourly?.time)||!Array.isArray(data.hourly?.precipitation_probability)||data.hourly.time.length!==data.hourly.precipitation_probability.length)throw Error('Missing hourly forecast');
  return data;
}
async function main(){
  let snapshot=null;
  const url='https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=2&timezone=Asia%2FShanghai&timeformat=unixtime';
  for(let attempt=1;attempt<=2;attempt++){
    try{
      const res=await fetch(url,{signal:AbortSignal.timeout(20000)});
      if(!res.ok)throw Error(`HTTP ${res.status}`);
      const data=validWeather(await res.json());
      snapshot={...data,fetchedAt:new Date().toISOString()};
      await mkdir(resolve(root,'.cache'),{recursive:true});
      await writeFile(cache+'.tmp',JSON.stringify(snapshot));await rename(cache+'.tmp',cache);
      console.log('Shanghai weather fetched and validated.');break;
    }catch(error){console.warn(`::warning::Weather attempt ${attempt} failed: ${error.message}`)}
  }
  if(!snapshot){try{snapshot=validWeather(JSON.parse(await readFile(cache,'utf8')));console.log('Using weather cache under 3 hours old.')}catch{console.warn('::warning::No valid weather snapshot available.')}}
  await writeFile(resolve(root,'weather-data.js'),`// Public Shanghai weather snapshot.\nwindow.shanghaiWeather = ${JSON.stringify(snapshot)};\n`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
