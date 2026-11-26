(() => {
  const seconds=10;let timer=null;
  function cancel(){clearTimeout(timer);timer=null;}
  function refresh(){
    makeCopy();
  }
  function schedule(){
    cancel();
    if(!seconds||document.hidden)return;
    timer=setTimeout(()=>{if(!document.hidden)refresh();schedule()},seconds*1000);
  }
  document.addEventListener('visibilitychange',()=>{
    cancel();
    if(!document.hidden){refresh();schedule()}
  });
  // Resume cleanly after restoring a page from the back/forward cache.
  window.addEventListener('pageshow',event=>{if(event.persisted&&!document.hidden){refresh();schedule()}});
  window.addEventListener('pagehide',cancel);
  schedule();
})();
