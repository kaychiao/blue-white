(() => {
  const zone = 'Asia/Shanghai';
  const dateFormat = new Intl.DateTimeFormat('zh-CN', {timeZone:zone,month:'long',day:'numeric',weekday:'long'});
  const timeFormat = new Intl.DateTimeFormat('en-GB', {timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  function tick() {
    const now=new Date(), time=timeFormat.format(now), [h,m,s]=time.split(':').map(Number);
    document.getElementById('date').textContent=dateFormat.format(now);
    const clock=document.getElementById('liveTime');clock.textContent=time;clock.dateTime=now.toISOString();
    document.getElementById('hourHand').style.transform=`rotate(${(h%12)*30+m*.5}deg)`;
    document.getElementById('minuteHand').style.transform=`rotate(${m*6+s*.1}deg)`;
    document.getElementById('secondHand').style.transform=`rotate(${s*6}deg)`;
    setTimeout(tick,1000-now.getMilliseconds());
  }
  tick();
  const cacheKey='bw-shanghai-weather-v1';let busy=false,lastAttempt=-Infinity,lastGood=null;
  const byId=id=>document.getElementById(id);
  const percent=n=>Number.isFinite(n)?`${Math.round(n)}%`:'—';
  const degrees=n=>Number.isFinite(n)?`${Math.round(n)}°`:'—';
  function description(code) {
    if(code===0)return '晴';if([1,2].includes(code))return '多云';if(code===3)return '阴';
    if([45,48].includes(code))return '有雾';if(code>=95)return '雷雨';
    if([71,73,75,77,85,86].includes(code))return '有雪';
    if([51,53,55,56,57].includes(code))return '细雨';
    if([61,63,65,66,67,80,81,82].includes(code))return '有雨';return '天气更新中';
  }
  function render(data,cached=false,connection='snapshot') {
    const c=data?.current;if(!c || !Number.isFinite(c.temperature_2m) || !Number.isFinite(c.time) || Date.now()-c.time*1000>24*3600000 || c.time*1000>Date.now()+900000)throw Error('Invalid or expired weather');
    const now=Date.now()/1000, times=data.hourly?.time||[], probs=data.hourly?.precipitation_probability||[];
    const windowValues=times.map((t,i)=>({t,p:probs[i]})).filter(x=>x.t>=Math.floor(now/3600)*3600 && x.t<now+3*3600 && Number.isFinite(x.p));
    const delayed=Date.now()-c.time*1000>3*3600000;
    const rain=!delayed&&windowValues.length?Math.max(...windowValues.map(x=>x.p)):null;
    byId('temperature').textContent=degrees(c.temperature_2m);byId('conditions').textContent=c.condition_text || description(c.weather_code);
    byId('feelsLike').textContent=degrees(c.apparent_temperature);byId('humidity').textContent=percent(c.relative_humidity_2m);byId('rainChance').textContent=percent(rain);
    byId('humidityCompact').textContent=percent(c.relative_humidity_2m);byId('rainCompact').textContent=percent(rain);
    const feels=Number.isFinite(c.apparent_temperature)?c.apparent_temperature:c.temperature_2m;
    let clothes=feels<5?'厚外套或羽绒服，围巾也带上。':feels<12?'毛衣加厚外套，怕冷可以加条围巾。':feels<18?'长袖配外套，早晚别穿太薄。':feels<25?'薄长袖或轻外套，方便随时增减。':'轻薄透气的衣服，出门注意防晒。';
    if(c.wind_speed_10m>=20)clothes+=' 风比较大，外层选挡风一点的。';
    if(c.has_precipitation || rain>=40 || [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(c.weather_code))clothes+=' 出门带把伞。';
    byId('clothing').textContent=delayed?'这份天气观测较早，出门前请查看当地实时预报。':clothes;
    const stamp=new Intl.DateTimeFormat('zh-CN',{timeZone:zone,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(c.time*1000));
    const stale=Date.now()-c.time*1000>90*60*1000;
    const freshness=byId('weatherFreshness');freshness.hidden=!stale&&connection!=='live';freshness.textContent=`${stamp} 观测${stale?' · 较早数据':''}`;
    byId('weatherUpdated').textContent=`${stamp} 观测 · ${connection==='live'?'接口查询':cached?'本地备用':'发布快照'} · 数据说明`;
    byId('weatherStatus').textContent=connection==='live'?`已查询和风 · ${stamp} 观测 · 接口最多缓存 5 分钟`:`实时连接暂不可用 · ${stamp} ${cached?'本地备用':'发布快照'}${stale?' · 较早数据':''}`;
    const attribution=byId('weatherAttribution');
    const isQWeather=data.source==='qweather';
    attribution.textContent=isQWeather?'和风天气 ↗':'Open-Meteo ↗';
    attribution.href=isQWeather?'https://www.qweather.com/':'https://open-meteo.com/';
    const extra=byId('weatherAttributionLinks');extra.replaceChildren();
    for(const href of data.attributionURLs||[]){
      try{const url=new URL(href);if(url.protocol!=='https:')continue;const a=document.createElement('a');a.href=url.href;a.textContent='数据归因 ↗';a.target='_blank';a.rel='noopener noreferrer';extra.append(a)}catch{}
    }
    lastGood=data;
    byId('weatherPanel').setAttribute('aria-busy','false');
  }
  function loadSnapshot() {
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');let finished=false;
      script.src='./data/weather-data.js'+(location.protocol==='file:'?'':`?v=${Date.now()}`);
      const timer=setTimeout(()=>done(new Error('Snapshot timeout')),10000);
      function done(error){if(finished)return;finished=true;clearTimeout(timer);script.remove();error?reject(error):resolve(window.shanghaiWeather)}
      script.onload=()=>done();script.onerror=()=>done(new Error('Snapshot unavailable'));
      document.head.append(script);
    });
  }
  async function loadLive(){
    const endpoint=window.weatherConfig?.endpoint;
    if(!endpoint)throw Error('Live weather not configured');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(endpoint,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error('Live weather unavailable');
      const data=await response.json(),c=data?.current;
      if(!c||!Number.isFinite(c.time)||Date.now()-c.time*1000>3*3600000)throw Error('Live observation expired');
      return data;
    }finally{clearTimeout(timeout)}
  }
  function showFallback(extra){
    const choices=[{data:lastGood},{data:window.shanghaiWeather},{data:extra}];
    try{const saved=JSON.parse(localStorage.getItem(cacheKey));if(saved&&Date.now()-saved.savedAt<24*3600000)choices.push({data:saved.data,cached:true})}catch{}
    choices.sort((a,b)=>(b.data?.current?.time||0)-(a.data?.current?.time||0));
    for(const choice of choices){try{render(choice.data,!!choice.cached);return true}catch{}}
    return false;
  }
  async function refresh(force=false){
    if(busy||(!force&&Date.now()-lastAttempt<60000))return;
    busy=true;lastAttempt=Date.now();byId('weatherRefresh').disabled=true;byId('weatherPanel').setAttribute('aria-busy','true');
    try{
      const data=await loadLive();render(data,false,'live');
      try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),data}))}catch{}
    }catch{
      let shown=showFallback();
      if(!shown){try{shown=showFallback(await loadSnapshot())}catch{}}
      if(!shown){byId('weatherFreshness').hidden=true;byId('weatherUpdated').textContent='暂未更新 · 数据说明';for(const id of ['temperature','feelsLike','humidity','rainChance','humidityCompact','rainCompact'])byId(id).textContent='—';byId('conditions').textContent='暂时无法获取';byId('clothing').textContent='天气连接暂不可用，出门前看看当地预报。';byId('weatherStatus').textContent='实时连接失败，且没有有效备用观测 · 稍后再试';}
    }finally{busy=false;byId('weatherRefresh').disabled=false;byId('weatherPanel').setAttribute('aria-busy','false')}
  }
  byId('weatherRefresh').addEventListener('click',()=>refresh(true));
  try{render(window.shanghaiWeather)}catch{}
  refresh();setInterval(()=>{if(!document.hidden)refresh()},5*60*1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
