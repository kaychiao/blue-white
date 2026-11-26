// Four quiet points of light: the meaning stays between the people who know it.
window.createStarSecret = ({button,label,getLabel,redraw,reducedMotion}) => {
  const duration=8200,holdDelay=1000;
  const whispers=[
    'You crossed my mind.',
    'Thinking of you, quietly.',
    'A little light, just for you.',
    'Somewhere in my day, there you are.',
    'My thoughts found their way to you.',
    'Even the quiet reminds me of you.',
    'A small thought. A warm feeling.',
    'You make ordinary moments softer.',
    'There you are, in my thoughts again.',
    'I saved a little starlight for you.',
    'A quiet hello, from me to you.',
    "If thoughts could glow, you'd know.",
    'One little moment, all about you.',
    'You found your way into my day.',
    'The stars can keep our little secret.',
    'A little closer, even from here.',
    'Some thoughts arrive with your name.',
    'This little light reminds me of you.',
    'I like finding you in my thoughts.',
    'No hurry. Just a thought of you.',
    'A soft pause, and there you are.',
    'I thought of you. The stars noticed.',
    "In this quiet moment, it's you.",
    "There's a little more light with you."
  ];
  const whisperKey='bw-star-whispers-v1';let remaining=[],lastWhisper='',currentWhisper='';
  try{const saved=JSON.parse(sessionStorage.getItem(whisperKey)||'null');if(saved&&Array.isArray(saved.remaining)){remaining=[...new Set(saved.remaining.filter(line=>whispers.includes(line)))];lastWhisper=whispers.includes(saved.last)?saved.last:''}}catch{}
  function pickWhisper(){
    if(!remaining.length){remaining=[...whispers];for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}}
    if(remaining[remaining.length-1]===lastWhisper&&remaining.length>1)[remaining[0],remaining[remaining.length-1]]=[remaining[remaining.length-1],remaining[0]];
    lastWhisper=remaining.pop();try{sessionStorage.setItem(whisperKey,JSON.stringify({last:lastWhisper,remaining}))}catch{}
    return lastWhisper;
  }
  let active=false,started=0,endTimer=null,holdTimer=null,origin=null,consumed=false,lastMinute='';
  const anchors=[[.22,.32],[.7,.22],[.8,.66],[.31,.77]];
  const clock=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function syncLabel(){label.textContent=active?currentWhisper:getLabel()}
  function finish(){active=false;clearTimeout(endTimer);endTimer=null;syncLabel();if(!document.hidden)redraw()}
  function reveal(){
    if(document.hidden||active)return false;
    active=true;currentWhisper=pickWhisper();started=Date.now();syncLabel();clearTimeout(endTimer);endTimer=setTimeout(finish,duration);redraw();return true;
  }
  function checkClock(){
    if(document.hidden)return;
    const p=Object.fromEntries(clock.formatToParts(new Date()).map(part=>[part.type,part.value]));
    if(p.minute!=='11'||!['11','23'].includes(p.hour))return;
    const key=`${p.year}-${p.month}-${p.day}-${p.hour}`;if(lastMinute===key)return;
    lastMinute=key;
    try{if(sessionStorage.getItem('bw-star-minute')===key)return;sessionStorage.setItem('bw-star-minute',key)}catch{}
    reveal();
  }
  function cancelHold(){clearTimeout(holdTimer);holdTimer=null;origin=null}
  button.addEventListener('pointerdown',event=>{
    if(event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
    cancelHold();consumed=false;origin={x:event.clientX,y:event.clientY};
    holdTimer=setTimeout(()=>{holdTimer=null;consumed=true;reveal()},holdDelay);
  });
  button.addEventListener('pointermove',event=>{if(origin&&Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>5)cancelHold()});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,cancelHold);
  button.addEventListener('contextmenu',event=>event.preventDefault());
  // A keyboard alternative to the otherwise hidden press-and-hold gesture.
  button.addEventListener('keydown',event=>{if(event.shiftKey&&event.key==='Enter'){event.preventDefault();reveal()}});
  document.addEventListener('visibilitychange',()=>{cancelHold();if(!document.hidden){if(active&&Date.now()-started>=duration)finish();checkClock()}});
  window.addEventListener('pagehide',cancelHold);
  setInterval(checkClock,1000);
  function draw(ctx,w,h,time){
    const elapsed=active?(Date.now()-started)/1000:0;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
    const alignment=active?(reducedMotion()?1:smooth(elapsed/1.2)*(1-smooth((elapsed-6.2)/2))):0;
    ctx.save();
    anchors.forEach(([ax,ay],i)=>{
      const drift=reducedMotion()?0:Math.sin(time*.15+i*1.7)*.012;
      const x=((ax+drift)*(1-alignment)+(.32+i*.12)*alignment)*w;
      const y=((ay+drift)*(1-alignment)+.5*alignment)*h;
      const beat=active?(reducedMotion()?1:Math.exp(-(((elapsed-(1.5+i*.8))/.32)**2))):0;
      // A vertical trace for each star: four quiet strokes, never literal digits.
      if(alignment>0){
        const length=Math.min(w,h)*.17*alignment;
        const trace=ctx.createLinearGradient(x,y-length/2,x,y+length/2);
        trace.addColorStop(0,'rgba(87,142,196,0)');trace.addColorStop(.18,'#7aabd5');trace.addColorStop(.5,'#4e88be');trace.addColorStop(.82,'#7aabd5');trace.addColorStop(1,'rgba(87,142,196,0)');
        ctx.globalAlpha=alignment*(.6+beat*.4);ctx.strokeStyle=trace;ctx.lineWidth=2+beat;ctx.lineCap='round';ctx.shadowColor='#8fc9f6';ctx.shadowBlur=8+beat*10;
        ctx.beginPath();ctx.moveTo(x,y-length/2);ctx.lineTo(x,y+length/2);ctx.stroke();
      }
      const radius=1.7+beat*1.8;
      ctx.globalAlpha=.7+beat*.3;ctx.fillStyle='#578ec4';ctx.shadowColor='#79b9f3';ctx.shadowBlur=5+beat*16;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.globalAlpha=.35+beat*.5;ctx.strokeStyle='#578ec4';ctx.lineWidth=.8;
      const ray=3+beat*4;ctx.beginPath();ctx.moveTo(x-ray,y);ctx.lineTo(x+ray,y);ctx.moveTo(x,y-ray);ctx.lineTo(x,y+ray);ctx.stroke();
    });ctx.restore();
  }
  return {draw,reveal,checkClock,syncLabel,consumeClick(){const result=consumed;consumed=false;return result},get active(){return active}};
};
