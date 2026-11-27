// A fictional love note, never a measurement of someone's pulse or feelings.
((root) => {
  const DAY=86400,TAU=Math.PI*2,cache=new Map();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
  // Matching endpoints keep Shanghai midnight continuous. Smooth joins let noon rest.
  const knots=[[0,91],[3,78],[6,72],[9,80],[12,84],[15,85],[17,88],[20,91],[22,92],[24,91]];
  function dayEvents(day){
    if(cache.has(day))return cache.get(day);
    let seed=(day^0x5201111)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    const events=[];let t=120+random()*240;
    while(t<DAY){events.push({at:day*DAY-28800+t,duration:18+random()*14,strength:1.1+random()*1.7});t+=180+random()*240}
    cache.set(day,events);if(cache.size>4)cache.delete(cache.keys().next().value);return events;
  }
  function sample(milliseconds){
    const seconds=milliseconds/1000,day=Math.floor((seconds+28800)/DAY),local=seconds-(day*DAY-28800),hour=local/3600;
    let i=1;while(hour>knots[i][0])i++;
    const [a,x]=knots[i-1],[b,y]=knots[i];const base=x+(y-x)*smooth((hour-a)/(b-a));
    const breath=.46*Math.sin(TAU*seconds/9.8)+.16*Math.sin(TAU*seconds/14.6);
    let flutter=0,memory=0;
    for(const event of [...dayEvents(day-1),...dayEvents(day)]){
      const age=seconds-event.at;
      if(age>=0&&age<event.duration)flutter+=event.strength*Math.sin(Math.PI*age/event.duration)**2;
      const after=age-event.duration;
      if(after>=0&&after<DAY)memory+=.1*smooth(after/5)*Math.exp(-after/21600)*(1-smooth((after-72000)/14400));
    }
    // Two little waves at the same appointments as the four-star secret.
    let appointment=0,appointed=false;
    for(const hour of [11,23]){
      const elapsed=local-(hour*3600+11*60);
      if(elapsed>=0&&elapsed<24){appointed=true;appointment+=1.5*Math.exp(-(((elapsed-6)/2.4)**2))+1.2*Math.exp(-(((elapsed-13)/3.2)**2))}
    }
    const trace=2.6*(1-Math.exp(-memory/2.6));
    const value=clamp(base+breath+flutter+appointment+trace,4,99.9);
    const bpm=clamp(62+base*.16+flutter*1.8+appointment*2+.8*Math.sin(seconds/7)+.5*Math.sin(seconds/2.9),58,88);
    return {value,bpm,base,breath,flutter,trace,appointment,appointed,hour};
  }
  const model={sample};
  if(typeof module==='object'&&module.exports)module.exports=model;
  else root.LongingModel=model;
})(typeof window==='object'?window:globalThis);
