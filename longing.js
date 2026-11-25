(() => {
  const format=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const meter=document.getElementById('longing');
  function tick(){
    const [h,m,s]=format.format(new Date()).split(':').map(Number);
    // A little daily love note: grows gently from 06:00 to midnight, never reaches a full stop.
    const progress=Math.max(0,Math.min(1,(h*3600+m*60+s-6*3600)/(18*3600)));
    const index=12+87.9*Math.pow(progress,.85);
    document.getElementById('longingValue').textContent=index.toFixed(1);
    meter.style.setProperty('--heartbeat',`${(1.8-progress*.65).toFixed(2)}s`);
    document.getElementById('longingNote').textContent=h<6?'夜深了，想念也轻一点。':h<11?'才刚开始，就已经想起你。':h<17?'忙碌的间隙，也分一点给你。':h<22?'天色慢慢暗了，想你多一点。':'今天快结束了，想你还没有。';
    setTimeout(tick,1000);
  }
  tick();
})();
