// Four quiet points of light: the meaning stays between the people who know it.
window.createStarSecret = ({button,label,getLabel,redraw,reducedMotion}) => {
  const duration=8200,holdDelay=1000;
  let active=false,started=0,endTimer=null,holdTimer=null,origin=null,consumed=false,lastMinute='';
  const anchors=[[.22,.32],[.7,.22],[.8,.66],[.31,.77]];
  const clock=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function syncLabel(){label.textContent=active?'You crossed my mind.':getLabel()}
  function finish(){active=false;clearTimeout(endTimer);endTimer=null;syncLabel();if(!document.hidden)redraw()}
  function reveal(){
    if(document.hidden||active)return false;
    active=true;started=Date.now();syncLabel();clearTimeout(endTimer);endTimer=setTimeout(finish,duration);redraw();return true;
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
      const radius=1.7+beat*1.8;
      ctx.globalAlpha=.7+beat*.3;ctx.fillStyle='#578ec4';ctx.shadowColor='#79b9f3';ctx.shadowBlur=5+beat*16;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.globalAlpha=.35+beat*.5;ctx.strokeStyle='#578ec4';ctx.lineWidth=.8;
      const ray=3+beat*4;ctx.beginPath();ctx.moveTo(x-ray,y);ctx.lineTo(x+ray,y);ctx.moveTo(x,y-ray);ctx.lineTo(x,y+ray);ctx.stroke();
    });ctx.restore();
  }
  return {draw,reveal,checkClock,syncLabel,consumeClick(){const result=consumed;consumed=false;return result},get active(){return active}};
};
