(() => {
  const meter=document.getElementById('longing'),button=document.getElementById('longingSecret');
  const valueLabel=document.getElementById('longingValue'),noteLabel=document.getElementById('longingNote');
  const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const notes=[
    '数字到这里，想你还继续。','有些想念，装不进百分比。',
    '这一秒，多出来的想念都给你。','刻度有尽头，惦记没有。',
    '你轻轻一碰，心里就满了一点。','不止今天，也不止这一点。',
    'Some things don’t fit in a number.','A little more than numbers can say.'
  ];
  let until=0,last=-1,secretNote='',timer=0,hideAt=null,returnAt=-Infinity,lastBeat=-Infinity;
  let shown=window.LongingModel.sample(Date.now()).value,lastTime=Date.now();
  function restore(){until=0;meter.classList.remove('is-secret')}
  function reveal(){
    if(until>Date.now())return;
    const choices=notes.map((_,i)=>i).filter(i=>i!==last);last=choices[Math.floor(Math.random()*choices.length)];secretNote=notes[last];
    until=Date.now()+5200;meter.classList.add('is-secret');render();
  }
  function render(){
    const now=Date.now(),state=window.LongingModel.sample(now),elapsed=(now-returnAt)/1000;
    const reunion=elapsed>=0&&elapsed<24?1.8*Math.sin(Math.PI*elapsed/24)**2:0;
    const target=Math.min(99.9,state.value+reunion),dt=Math.max(0,Math.min(1,(now-lastTime)/1000));lastTime=now;
    // Continue the hidden reading during infinity, then gently rejoin its current curve.
    shown+=(target-shown)*(1-Math.exp(-dt/2.2));
    if(until&&now>=until)restore();
    valueLabel.textContent=until>now?'∞':shown.toFixed(1);
    if(now-lastBeat>=5000){meter.style.setProperty('--heartbeat',`${(60/(state.bpm+reunion*2)).toFixed(3)}s`);lastBeat=now}
    const h=state.hour;
    const note=until>now?secretNote:elapsed>=0&&elapsed<12?'你一回来，心跳就漏了半拍。':state.appointed?'四道星光，两次心动，都是想你。':h<6?'夜深了，想念也轻一点。':h<11?'才刚开始，就已经想起你。':h<17?'忙碌的间隙，也分一点给你。':h<22?'天色慢慢暗了，想你多一点。':'今天快结束了，想你还没有。';
    if(noteLabel.textContent!==note)noteLabel.textContent=note;
  }
  function loop(){clearTimeout(timer);if(document.hidden)return;render();timer=setTimeout(loop,motion?.matches?1000:250)}
  button.addEventListener('click',reveal);
  button.addEventListener('keydown',event=>{if(event.key==='Escape'){restore();render()}});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hideAt=Date.now();restore();clearTimeout(timer)}
    else{if(hideAt!==null&&Date.now()-hideAt>=15000)returnAt=Date.now();hideAt=null;lastTime=Date.now();loop()}
  });
  motion?.addEventListener('change',loop);loop();
})();
