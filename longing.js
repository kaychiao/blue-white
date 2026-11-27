(() => {
  const format=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const meter=document.getElementById('longing');
  const button=document.getElementById('longingSecret');
  const notes=[
    '数字到这里，想你还继续。',
    '有些想念，装不进百分比。',
    '这一秒，多出来的想念都给你。',
    '刻度有尽头，惦记没有。',
    '你轻轻一碰，心里就满了一点。',
    '不止今天，也不止这一点。',
    'Some things don’t fit in a number.',
    'A little more than numbers can say.'
  ];
  let until=0,timer=0,last=-1,secretNote='';
  function restore(){until=0;clearTimeout(timer);meter.classList.remove('is-secret');tick(false)}
  function reveal(){
    if(until>Date.now())return;
    const choices=notes.map((_,i)=>i).filter(i=>i!==last);last=choices[Math.floor(Math.random()*choices.length)];secretNote=notes[last];
    until=Date.now()+5200;meter.classList.add('is-secret');tick(false);timer=setTimeout(restore,5200);
  }
  button.addEventListener('click',reveal);
  button.addEventListener('keydown',event=>{if(event.key==='Escape')restore()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)restore()});
  function tick(schedule=true){
    const [h,m,s]=format.format(new Date()).split(':').map(Number);
    // A little daily love note: grows gently from 06:00 to midnight, never reaches a full stop.
    const progress=Math.max(0,Math.min(1,(h*3600+m*60+s-6*3600)/(18*3600)));
    const index=12+87.9*Math.pow(progress,.85);
    document.getElementById('longingValue').textContent=until>Date.now()?'∞':index.toFixed(1);
    meter.style.setProperty('--heartbeat',`${(1.8-progress*.65).toFixed(2)}s`);
    document.getElementById('longingNote').textContent=until>Date.now()?secretNote:h<6?'夜深了，想念也轻一点。':h<11?'才刚开始，就已经想起你。':h<17?'忙碌的间隙，也分一点给你。':h<22?'天色慢慢暗了，想你多一点。':'今天快结束了，想你还没有。';
    if(schedule)setTimeout(tick,1000);
  }
  tick();
})();
