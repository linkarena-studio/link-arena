/* LINK ARENA original procedural audio, no external recordings */
(function(){
 "use strict";
 let context=null,master=null,timer=null,step=0,muted=false,volume=.35;
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 const melody=[76,null,79,null,81,79,76,null,74,null,76,79,74,null,71,null,
 72,null,76,79,81,null,79,null,76,74,72,null,71,null,74,null];
 const bass=[48,43,45,40,48,43,45,47];
 const noteHz=n=>440*Math.pow(2,(n-69)/12);
 function init(){
  if(context||!AudioContextClass)return;
  try{context=new AudioContextClass();master=context.createGain();master.gain.value=volume;master.connect(context.destination)}
  catch(e){context=null;master=null}
 }
 function tone(n,d=.12,type="sine",gain=.12,delay=0){
  if(!context||!master||muted||document.hidden)return;
  const start=context.currentTime+delay;
  try{
   const osc=context.createOscillator(),env=context.createGain();
   osc.type=type;osc.frequency.setValueAtTime(noteHz(n),start);
   env.gain.setValueAtTime(.0001,start);
   env.gain.exponentialRampToValueAtTime(Math.max(.002,gain),start+.012);
   env.gain.exponentialRampToValueAtTime(.0001,start+d);
   osc.connect(env);env.connect(master);osc.start(start);osc.stop(start+d+.025);
  }catch(e){}
 }
 function tick(){
  if(muted||!context||context.state!=="running"||document.hidden)return;
  const i=step++%32,m=melody[i];
  if(m!==null)tone(m,.18,"triangle",.045);
  if(i%4===0)tone(bass[Math.floor(step/4-1)%bass.length+ (Math.floor(step/4-1)%bass.length<0?bass.length:0)],.45,"sine",.055);
  if(i%8===4)tone(60,.13,"sine",.017);
 }
 function start(){
  if(muted)return;
  init();if(!context)return;
  try{const result=context.resume();if(result&&result.catch)result.catch(()=>{})}catch(e){}
  if(!timer){tick();timer=setInterval(tick,235)}
 }
 function cue(name){
  if(muted)return;
  init();if(!context)return;
  try{const p=context.resume();if(p&&p.catch)p.catch(()=>{})}catch(e){}
  switch(name){
   case "select":tone(79,.08,"sine",.13);break;
   case "deal":case "draw":tone(74,.08,"triangle",.11);tone(79,.11,"sine",.09,.07);break;
   case "place":tone(69,.09,"triangle",.18);tone(76,.18,"triangle",.15,.08);break;
   case "special":tone(77,.1,"sine",.17);tone(81,.12,"triangle",.14,.12);tone(84,.22,"sine",.13,.25);break;
   case "win":[72,76,79,84].forEach((n,i)=>tone(n,.36,"triangle",.17,i*.14));break;
   case "lose":[74,71,67].forEach((n,i)=>tone(n,.32,"sine",.13,i*.17));break;
   case "join":tone(76,.1,"sine",.12);tone(81,.2,"triangle",.12,.11);break;
  }
 }
 function setVolume(v){const n=Number(v);if(!Number.isFinite(n))return;volume=Math.max(0,Math.min(1,n));if(master)master.gain.setTargetAtTime(volume,context.currentTime,.02);return volume}
 function setMuted(m){muted=Boolean(m);if(muted){if(context&&context.state==="running")context.suspend().catch(()=>{})}else start();return muted}
 function toggle(){return setMuted(!muted)}
 function stop(){if(timer){clearInterval(timer);timer=null}if(context&&context.state==="running")context.suspend().catch(()=>{})}
 window.LAAudio={start,cue,setVolume,setMuted,toggle,stop,get muted(){return muted},get volume(){return volume}};
 document.addEventListener("visibilitychange",()=>{if(document.hidden)return;if(timer&&!muted&&context&&context.state==="suspended")context.resume().catch(()=>{})});
})();
