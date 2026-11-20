/* LINK ARENA sound settings shared by both game modes */
(function(){
"use strict";
function install(){
const audio=window.LAAudio;if(!audio)return;
const style=document.createElement("style");
style.textContent=".audio-controls{display:none!important}#laSettingsButton{position:fixed;z-index:210;right:max(9px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));width:38px;height:38px;min-height:38px;border:1px solid #e7d18a;background:#0e4334e8;color:#f7e6b5;border-radius:50%;font-size:21px;padding:3px;box-shadow:0 2px 8px #0008;display:grid;place-items:center;line-height:1}#laSettingsShade{position:fixed;z-index:211;inset:0;background:#02160edb;display:none;align-items:center;justify-content:center;padding:14px}#laSettingsShade.open{display:flex}#laSettingsPanel{width:min(92vw,430px);max-height:92dvh;overflow:auto;border-radius:20px;background:linear-gradient(145deg,#256b4f,#103b2e);border:2px solid #e3c17a;color:#fff0cf;padding:18px 20px;box-shadow:0 12px 40px #0009;font-family:system-ui,-apple-system,'Noto Sans JP',sans-serif}#laSettingsPanel h2{font-size:21px;margin:0 0 15px;color:#ffe39c;text-align:center}#laSettingsPanel label{display:block;font-size:14px;font-weight:750;margin:12px 0 6px}#laSettingsPanel select{width:100%;background:#f8f2df;color:#163f31;border-radius:10px;border:0;font-size:15px;padding:11px;min-height:45px}#laVolumeRow{display:flex;gap:9px;align-items:center}#laVolumeRow input{flex:1;width:100%;accent-color:#f1d58d;height:30px}#laVolumeRow strong{min-width:39px;text-align:right;color:#ffe39c}#laSettingsActions{display:flex;gap:8px;margin-top:18px}#laSettingsActions button{flex:1;background:#f3d38c;color:#164433;border:0;border-radius:10px;min-height:42px;padding:8px 3px;font-size:13px;font-weight:800}#laSettingsActions button.alt{background:#cee5d8}#laSettingsPanel .hint{font-size:12px;line-height:1.5;color:#d4e9df;margin:9px 0 0}@media(orientation:landscape) and (max-height:430px){#laSettingsButton{top:6px;right:8px;width:33px;height:33px;min-height:33px;font-size:18px}#laSettingsPanel{padding:10px 16px}#laSettingsPanel h2{font-size:17px;margin-bottom:4px}#laSettingsPanel label{margin:6px 0 3px}#laSettingsActions{margin-top:8px}}";
document.head.appendChild(style);
const gear=document.createElement("button");gear.id="laSettingsButton";gear.type="button";gear.textContent="⚙️";gear.title="サウンド設定";gear.setAttribute("aria-label","サウンド設定を開く");document.body.appendChild(gear);
const shade=document.createElement("div");shade.id="laSettingsShade";
shade.innerHTML='<div id="laSettingsPanel" role="dialog" aria-modal="true" aria-label="音楽と音量の設定"><h2>⚙️ サウンド設定</h2><label for="laTrackSelect">BGMを選択</label><select id="laTrackSelect"><option value="retro">① はじまりのパズル — レトロゲーム風</option><option value="journey">② 旅路の灯 — 穏やかなファンタジー</option><option value="dawn">③ 暁の翼 — 高揚感のある新曲</option></select><label for="laVolumeSlider">全体の音量</label><div id="laVolumeRow"><input id="laVolumeSlider" type="range" min="0" max="100" step="1"><strong id="laVolumeLabel">16%</strong></div><div id="laSettingsActions"><button class="alt" id="laToggleAudio" type="button">🔊 ミュート</button><button id="laTryAudio" type="button">▶ 試聴</button><button id="laCloseSettings" type="button">閉じる</button></div><p class="hint">BGMと効果音に共通の音量です。設定はこの端末に保存されます。iPhoneでは「試聴」を押すと音楽が始まります。</p></div>';
document.body.appendChild(shade);
const get=id=>shade.querySelector("#"+id),track=get("laTrackSelect"),slider=get("laVolumeSlider"),vol=get("laVolumeLabel"),toggle=get("laToggleAudio");
const update=()=>{track.value=audio.track||"journey";slider.value=Math.round((audio.volume??.16)*100);vol.textContent=slider.value+"%";toggle.textContent=audio.muted?"🔇 ミュート解除":"🔊 ミュート"};
gear.addEventListener("click",()=>{update();shade.classList.add("open");track.focus()});
const close=()=>{shade.classList.remove("open");gear.focus()};
get("laCloseSettings").addEventListener("click",close);
shade.addEventListener("click",e=>{if(e.target===shade)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&shade.classList.contains("open"))close()});
track.addEventListener("change",()=>{audio.setTrack(track.value);audio.start()});
slider.addEventListener("input",()=>{audio.setVolume(Number(slider.value)/100);vol.textContent=slider.value+"%";if(audio.muted&&Number(slider.value)>0)audio.setMuted(false);update()});
toggle.addEventListener("click",()=>{audio.toggle();update()});
get("laTryAudio").addEventListener("click",()=>{if(audio.muted)audio.setMuted(false);audio.start();audio.cue("join");update()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();