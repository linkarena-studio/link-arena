/* Optional LINK ARENA WebSocket relay, compatible with existing PeerJS events.
   Set LA_RELAY_URL to the deployed wss://.../ws address to activate. */
(function(){
"use strict";
const URL=window.LA_RELAY_URL||"";
class Events{
 constructor(){this.handlers=new Map()}
 on(type,fn){const a=this.handlers.get(type)||[];a.push(fn);this.handlers.set(type,a);return this}
 emit(type,...args){for(const f of this.handlers.get(type)||[])f(...args)}
}
class RelayConnection extends Events{
 constructor(parent,remote,open=false){super();this.parent=parent;this.remote=remote;this.open=open}
 send(data){if(this.open)this.parent.send({t:"data",to:this.remote,data})}
 close(){if(this.open)this.parent.send({t:"close",to:this.remote});this.finish()}
 finish(){this.open=false;this.parent.connections.delete(this.remote);if(!this.closed){this.closed=true;this.emit("close")}}
}
class RelayPeer extends Events{
 constructor(id){super();this.id=id||null;this.connections=new Map();this.destroyed=false;
  try{this.socket=new WebSocket(URL)}catch(e){setTimeout(()=>this.emit("error",{type:"network",message:e.message}),0);return}
  this.socket.onopen=()=>this.send({t:"register",id:this.id});
  this.socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}this.receive(m)};
  this.socket.onerror=()=>{if(!this.destroyed)this.emit("error",{type:"network",message:"中継サーバーへ接続できませんでした。"})};
  this.socket.onclose=()=>{for(const c of [...this.connections.values()])c.finish();clearInterval(this.ping);if(!this.destroyed)this.emit("disconnected")};
  this.ping=setInterval(()=>this.send({t:"ping"}),20000);
 }
 send(msg){if(this.socket?.readyState===1)this.socket.send(JSON.stringify(msg))}
 receive(m){
  if(m.t==="ready"){this.id=m.id;this.emit("open",m.id)}
  else if(m.t==="incoming"){const c=new RelayConnection(this,m.from,true);this.connections.set(m.from,c);this.emit("connection",c)}
  else if(m.t==="opened"){const c=this.connections.get(m.from);if(c){c.open=true;c.emit("open")}}
  else if(m.t==="data"){this.connections.get(m.from)?.emit("data",m.data)}
  else if(m.t==="closed"){this.connections.get(m.from)?.finish()}
  else if(m.t==="error"){this.emit("error",{type:m.type,message:m.message})}
 }
 connect(remote){const c=new RelayConnection(this,remote);this.connections.set(remote,c);this.send({t:"connect",to:remote});return c}
 destroy(){this.destroyed=true;clearInterval(this.ping);for(const c of [...this.connections.values()])c.finish();try{this.socket?.close()}catch(e){}}
}
window.LARelay={available: /^wss:\/\//.test(URL),create:id=>new RelayPeer(id)};
})();