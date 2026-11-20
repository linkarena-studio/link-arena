/* LINK ARENA — "旅路の灯" / Lanterns on the Road
 * Original 6/8 fantasy-travel theme. Melody and harmony composed for LINK ARENA.
 * No samples, recordings, copyrighted melodies or external sound assets.
 */
(function(){
"use strict";
const AudioContextClass=window.AudioContext||window.webkitAudioContext;
let ctx=null,master=null,reverbSend=null,muted=false,volume=.16,timer=null;
let trackId="journey";
const TRACK_NAMES={retro:"はじまりのパズル（レトロ）",journey:"旅路の灯（ファンタジー）",dawn:"暁の翼（新曲）",velocity:"閃光ドライブ（高速バトル）"};
try{const saved=JSON.parse(localStorage.getItem("la_audio_settings_v3")||"{}");if(TRACK_NAMES[saved.track])trackId=saved.track;if(Number.isFinite(saved.volume))volume=Math.max(0,Math.min(1,saved.volume));muted=saved.muted===true}catch(e){}
function save(){try{localStorage.setItem("la_audio_settings_v3",JSON.stringify({track:trackId,volume,muted}))}catch(e){}}

let nextTime=0,step=0;
const EIGHTH=60/94/2; // 6/8, gentle flowing pace
const JOURNEY_CHORDS=[
 [47,50,54,59], [43,47,50,55], [50,54,57,62], [45,49,52,57],
 [40,43,47,52], [43,47,50,55], [50,54,57,62], [42,45,49,54],
 [47,50,54,59], [43,47,50,55], [50,54,57,62], [45,49,52,57],
 [40,43,47,52], [43,47,50,55], [45,49,52,57], [47,50,54,59]
];
// Each phrase totals six eighth-note pulses; this is an entirely new tune.
const JOURNEY_MELODY=[
 [[74,2],[78,1],[81,2],[78,1]],
 [[79,2],[78,1],[74,3]],
 [[76,1],[78,1],[81,2],[78,2]],
 [[76,2],[73,1],[71,3]],
 [[71,2],[74,1],[76,2],[78,1]],
 [[79,2],[81,1],[83,2],[81,1]],
 [[78,2],[76,1],[74,3]],
 [[73,2],[74,1],[78,3]],
 [[81,3],[83,1],[86,2]],
 [[83,2],[81,1],[79,1],[78,2]],
 [[81,2],[78,1],[76,2],[74,1]],
 [[76,3],[73,1],[76,2]],
 [[78,2],[79,1],[81,2],[83,1]],
 [[81,2],[79,1],[78,3]],
 [[76,1],[78,1],[81,2],[76,2]],
 [[74,3],[71,3]]
];
const JOURNEY_LINE=JOURNEY_MELODY.flatMap(bar=>{
 const out=[];for(const [note,len] of bar){out.push({note,len});for(let i=1;i<len;i++)out.push(null)}return out;
});

/* Original alternate themes: no melodies extracted from the linked video. */
const RETRO_CHORDS=[
 [48,52,55,60],[45,48,52,57],[41,45,48,53],[43,47,50,55],
 [48,52,55,60],[45,48,52,57],[41,45,48,53],[43,47,50,55]
];
const RETRO_NOTES=[
 72,null,76,79,76,null,74,null,72,76,79,null,81,79,76,null,
 77,null,81,84,81,null,79,77,76,null,74,72,74,79,76,null
];
const DAWN_CHORDS=[
 [45,48,52,57],[41,45,48,53],[48,52,55,60],[43,47,50,55],
 [45,48,52,57],[41,45,48,53],[40,43,47,52],[43,47,50,55],
 [45,48,52,57],[41,45,48,53],[48,52,55,60],[43,47,50,55],
 [41,45,48,53],[43,47,50,55],[45,48,52,57],[45,48,52,57]
];
// 6/8, original energetic but airy theme in A minor / C-major colors.
const DAWN_MELODY=[
 [[81,1],[84,1],[88,2],[84,1],[81,1]],
 [[77,2],[81,1],[84,1],[81,2]],
 [[79,1],[81,1],[84,2],[86,1],[84,1]],
 [[79,2],[76,1],[74,1],[76,2]],
 [[81,2],[84,1],[88,2],[89,1]],
 [[88,1],[84,1],[81,1],[79,1],[77,2]],
 [[76,2],[79,1],[83,1],[86,2]],
 [[84,3],[81,1],[79,2]],
 [[84,1],[86,1],[88,1],[91,1],[88,2]],
 [[89,2],[88,1],[84,1],[81,2]],
 [[83,1],[86,1],[88,2],[86,1],[83,1]],
 [[81,2],[79,1],[76,3]],
 [[77,1],[81,1],[84,1],[89,1],[88,2]],
 [[86,2],[83,1],[81,1],[79,2]],
 [[81,2],[84,1],[88,1],[86,2]],
 [[84,2],[81,1],[79,1],[81,2]]
];
function expandBars(bars){return bars.flatMap(bar=>{const out=[];for(const [note,len] of bar){out.push({note,len});for(let i=1;i<len;i++)out.push(null)}return out})}
const DAWN_LINE=expandBars(DAWN_MELODY);

/* 閃光ドライブ — original high-energy battle theme, 160 BPM / 4/4.
   16 bars, 8 eighth-note slots per bar, punchy original lead and rhythm. */
const VELOCITY_CHORDS=[
 [40,43,47,52],[36,40,43,48],[43,47,50,55],[38,42,45,50],
 [40,43,47,52],[36,40,43,48],[45,48,52,57],[47,50,54,59],
 [40,43,47,52],[43,47,50,55],[36,40,43,48],[38,42,45,50],
 [45,48,52,57],[43,47,50,55],[47,50,54,59],[40,43,47,52]
];
// Each row sums to exactly eight eighth-note steps.
const VELOCITY_MELODY=[
 [[76,1],[79,1],[83,2],[81,1],[79,1],[76,2]],
 [[79,1],[76,1],[72,2],[76,1],[79,1],[84,2]],
 [[79,2],[83,1],[86,1],[83,2],[79,2]],
 [[81,1],[78,1],[74,2],[78,1],[81,1],[86,2]],
 [[88,1],[86,1],[83,1],[79,1],[83,2],[86,2]],
 [[84,2],[79,1],[76,1],[79,1],[84,1],[88,2]],
 [[81,1],[84,1],[88,2],[84,1],[81,1],[76,2]],
 [[83,1],[86,1],[90,2],[86,1],[83,1],[79,2]],
 [[88,2],[91,1],[88,1],[86,1],[83,1],[79,2]],
 [[86,1],[83,1],[79,1],[83,1],[86,2],[91,2]],
 [[84,1],[88,1],[91,2],[88,1],[84,1],[79,2]],
 [[86,1],[81,1],[78,2],[81,1],[86,1],[90,2]],
 [[88,1],[84,1],[81,1],[84,1],[88,2],[93,2]],
 [[91,2],[86,1],[83,1],[86,1],[91,1],[95,2]],
 [[90,1],[86,1],[83,2],[81,1],[78,1],[74,2]],
 [[79,1],[83,1],[88,2],[83,1],[79,1],[76,2]]
];
const VELOCITY_LINE=expandBars(VELOCITY_MELODY);

const tracks={
 journey:{seconds:EIGHTH,pulses:6,line:JOURNEY_LINE,chords:JOURNEY_CHORDS,melody:"flute"},
 retro:{seconds:60/132/2,pulses:4,line:RETRO_NOTES.map(x=>x===null?null:{note:x,len:1}),chords:RETRO_CHORDS,melody:"pluck"},
 dawn:{seconds:60/126/2,pulses:6,line:DAWN_LINE,chords:DAWN_CHORDS,melody:"flute"},
 velocity:{seconds:60/160/2,pulses:8,line:VELOCITY_LINE,chords:VELOCITY_CHORDS,melody:"lead"}
};
const midi=n=>440*Math.pow(2,(n-69)/12);
function init(){
 if(ctx||!AudioContextClass)return;
 try{
  ctx=new AudioContextClass();
  master=ctx.createGain();
  master.gain.value=volume;
  const soft=ctx.createDynamicsCompressor();
  soft.threshold.value=-15;soft.knee.value=15;soft.ratio.value=2.4;
  soft.attack.value=.008;soft.release.value=.28;
  master.connect(soft);soft.connect(ctx.destination);
  // Low-level stereo-ish room echoes provide depth without extra files.
  const delay=ctx.createDelay(1),wet=ctx.createGain(),feedback=ctx.createGain();
  delay.delayTime.value=.245;wet.gain.value=.16;feedback.gain.value=.17;
  delay.connect(wet);wet.connect(master);
  delay.connect(feedback);feedback.connect(delay);
  reverbSend=delay;
 }catch(e){ctx=null;master=null;reverbSend=null}
}
function synth(note,start,duration,kind="flute",level=.07){
 if(!ctx||!master||muted)return;
 const freq=midi(note),t=Math.max(ctx.currentTime+.001,start),len=Math.max(.06,duration);
 try{
  const out=ctx.createGain(),filter=ctx.createBiquadFilter();
  filter.type="lowpass";
  filter.frequency.value=kind==="pad"?1150:kind==="bass"?550:kind==="pluck"?2300:kind==="lead"?2700:3500;
  out.connect(filter);filter.connect(master);
  if(reverbSend&&kind!=="bass"){const send=ctx.createGain();send.gain.value=kind==="flute"?.23:.12;filter.connect(send);send.connect(reverbSend)}
  const attack=kind==="pad"?.14:kind==="flute"?.035:kind==="bass"?.035:kind==="lead"?.009:.008;
  const hold=Math.max(t+attack+.02,t+len-(kind==="pad"?.3:.06));
  const release=kind==="pad"?.36:kind==="flute"?.23:kind==="bass"?.18:kind==="lead"?.14:.16;
  out.gain.setValueAtTime(.0001,t);
  out.gain.linearRampToValueAtTime(level,t+attack);
  if(kind==="pluck")out.gain.exponentialRampToValueAtTime(Math.max(.0002,level*.26),hold);
  else out.gain.setValueAtTime(level,hold);
  out.gain.exponentialRampToValueAtTime(.0001,t+len+release);
  const primary=ctx.createOscillator();
  primary.type=kind==="flute"?"sine":kind==="pad"||kind==="lead"?"sawtooth":kind==="bass"?"sine":"triangle";
  primary.frequency.setValueAtTime(freq,t);
  if(kind==="flute"){primary.detune.setValueAtTime(-2,t);primary.detune.linearRampToValueAtTime(2,t+len)}
  primary.connect(out);primary.start(t);primary.stop(t+len+release+.04);
  if(kind==="flute"||kind==="pad"||kind==="lead"){
   const upper=ctx.createOscillator(),upperGain=ctx.createGain();
   upper.type=kind==="flute"?"sine":kind==="lead"?"square":"triangle";
   upper.frequency.value=freq*(kind==="flute"?2:kind==="lead"?1.006:1.003);
   upperGain.gain.value=kind==="flute"?.11:kind==="lead"?.15:.19;
   upper.connect(upperGain);upperGain.connect(out);
   upper.start(t);upper.stop(t+len+release+.04);
  }
 }catch(e){}
}

let noiseBuffer=null;
function noiseAt(t,duration,level,filterFrequency,kind="highpass"){
 if(!ctx||!master||muted)return;
 try{
  if(!noiseBuffer){
   noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
   const samples=noiseBuffer.getChannelData(0);
   // Random noise is original synthesizer output, not a recorded sample.
   for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
  }
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();
  source.buffer=noiseBuffer;filter.type=kind;filter.frequency.value=filterFrequency;
  source.connect(filter);filter.connect(env);env.connect(master);
  const start=Math.max(ctx.currentTime+.001,t);
  env.gain.setValueAtTime(Math.max(.001,level),start);
  env.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.start(start);source.stop(start+duration+.01);
 }catch(e){}
}
function drum(kind,t){
 if(!ctx||!master||muted)return;
 try{
  const start=Math.max(ctx.currentTime+.001,t);
  if(kind==="kick"){
   const o=ctx.createOscillator(),g=ctx.createGain();
   o.type="sine";o.frequency.setValueAtTime(125,start);
   o.frequency.exponentialRampToValueAtTime(46,start+.12);
   g.gain.setValueAtTime(.2,start);g.gain.exponentialRampToValueAtTime(.0001,start+.2);
   o.connect(g);g.connect(master);o.start(start);o.stop(start+.21);
  }else if(kind==="snare"){
   noiseAt(start,.115,.075,1000);
   synth(49,start,.09,"pluck",.025);
  }else if(kind==="hat"){
   noiseAt(start,.055,.023,6500);
  }
 }catch(e){}
}
function musicStep(i,t){
 const tr=tracks[trackId],pos=i%tr.pulses,bar=Math.floor(i/tr.pulses)%tr.chords.length;
 const chord=tr.chords[bar],phrase=tr.line[i%tr.line.length],eighth=tr.seconds;
 if(trackId==="velocity"){
  // Driving four-on-the-floor kick, snare on beats 2/4 and a tight eighth-note hat.
  if(pos%2===0)drum("kick",t);
  if(pos===2||pos===6)drum("snare",t);
  drum("hat",t);
  if(pos===0||pos===4){synth(chord[0]-12,t,eighth*1.8,"bass",.12);for(const n of chord.slice(1))synth(n+12,t,eighth*3.7,"pad",.006)}
  if(pos===3||pos===7)synth(chord[0]-12,t,eighth*.7,"bass",.084);
  synth(chord[[1,2,3,2,1,2,3,2][pos]]+12,t,eighth*.68,"pluck",.036);
  if(phrase)synth(phrase.note,t,phrase.len*eighth*.92,"lead",.07);
 }else if(trackId==="retro"){
  if(pos===0){synth(chord[0]-12,t,eighth*3,"bass",.047);for(const n of chord.slice(1))synth(n+12,t,eighth*3.7,"pad",.004)}
  synth(chord[[1,2,3,2][pos]]+12,t,eighth*.55,"pluck",.034);
  if(phrase)synth(phrase.note,t,eighth*.83,"pluck",.09);
 }else if(trackId==="dawn"){
  if(pos===0){synth(chord[0]-12,t,eighth*5.4,"bass",.056);for(const n of chord.slice(1))synth(n+12,t,eighth*5.6,"pad",.009)}
  synth(chord[[1,2,3,2,1,3][pos]]+12,t,eighth*.75,"pluck",.038);
  if(phrase)synth(phrase.note,t,Math.max(eighth*.9,phrase.len*eighth*.9),"flute",.091);
 }else{
  if(pos===0){for(const n of chord.slice(1))synth(n+12,t,eighth*5.6,"pad",.009);synth(chord[0]-12,t,eighth*4,"bass",.067)}
  synth(chord[[1,2,3,2,1,2][pos]]+12,t,eighth*.72,"pluck",pos===0?.034:.028);
  if(phrase)synth(phrase.note,t,phrase.len*eighth*.88,"flute",.083);
 }
}
function schedule(){
 if(!ctx||muted||document.hidden||ctx.state!=="running")return;
 const until=ctx.currentTime+.34;
 while(nextTime<until){
  musicStep(step,nextTime);
  nextTime+=tracks[trackId].seconds;step=(step+1)%(tracks[trackId].pulses*tracks[trackId].chords.length);
 }
}
function start(){
 if(muted)return;
 init();if(!ctx)return;
 try{
  const resumed=ctx.resume();
  if(resumed?.catch)resumed.catch(()=>{});
 }catch(e){}
 if(!timer){
  nextTime=Math.max(ctx.currentTime+.06,nextTime);
  timer=setInterval(schedule,55);
  schedule();
 }
}
function oneShot(note,duration=.14,kind="pluck",level=.17,delay=0){
 if(!ctx||muted||document.hidden)return;
 synth(note,ctx.currentTime+.025+delay,duration,kind,level);
}
function cue(name){
 if(muted)return;
 init();if(!ctx)return;
 try{ctx.resume().catch(()=>{})}catch(e){}
 switch(name){
 case "select":oneShot(79,.075,"pluck",.14);break;
 case "deal":case "draw":oneShot(74,.095,"pluck",.14);oneShot(81,.12,"flute",.12,.08);break;
 case "place":oneShot(69,.09,"pluck",.2);oneShot(76,.19,"pluck",.17,.07);break;
 case "special":oneShot(77,.13,"flute",.2);oneShot(81,.17,"pluck",.18,.13);oneShot(86,.22,"flute",.19,.27);break;
 case "win":[74,78,81,86].forEach((n,i)=>oneShot(n,.36,"flute",.2,i*.16));break;
 case "lose":[74,71,66].forEach((n,i)=>oneShot(n,.28,"flute",.13,i*.18));break;
 case "join":oneShot(76,.1,"pluck",.12);oneShot(81,.25,"flute",.13,.12);break;
 }
}
function setVolume(v){
 const n=Number(v);if(!Number.isFinite(n))return volume;
 volume=Math.max(0,Math.min(1,n));
 if(ctx&&master)master.gain.setTargetAtTime(muted?0:volume,ctx.currentTime,.03);
 save();return volume;
}
function setMuted(v){
 muted=Boolean(v);
 if(ctx&&master)master.gain.setTargetAtTime(muted?0:volume,ctx.currentTime,.02);
 if(muted){if(timer){clearInterval(timer);timer=null}}
 else {nextTime=ctx?ctx.currentTime+.07:0;start()}
 save();return muted;
}
function toggle(){return setMuted(!muted)}
function setTrack(id){
 if(!tracks[id])return trackId;
 trackId=id;step=0;nextTime=ctx?ctx.currentTime+.4:0;
 save();if(!muted)start();return trackId;
}
function stop(){
 if(timer){clearInterval(timer);timer=null}
 if(ctx&&master)master.gain.setTargetAtTime(0,ctx.currentTime,.02);
 if(ctx&&ctx.state==="running")ctx.suspend().catch(()=>{});
}
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){if(timer){clearInterval(timer);timer=null};if(ctx&&master)master.gain.setTargetAtTime(0,ctx.currentTime,.02)}
 else if(ctx&&!muted){master.gain.setTargetAtTime(volume,ctx.currentTime,.03);nextTime=ctx.currentTime+.07;start()}
});
window.LAAudio={start,cue,setVolume,setMuted,toggle,stop,setTrack,get muted(){return muted},get volume(){return volume},get track(){return trackId},tracks:TRACK_NAMES};
})();