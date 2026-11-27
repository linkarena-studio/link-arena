"use strict";
const http=require("node:http");
const {WebSocketServer,WebSocket}=require("ws");
const {randomUUID}=require("node:crypto");
const allowedOrigin="https://linkarena-studio.github.io";
const server=http.createServer((req,res)=>{
 res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
 res.end(JSON.stringify({service:"LINK ARENA relay",version:1}));
});
const wss=new WebSocketServer({noServer:true,maxPayload:65536});
const clients=new Map();
const isHost=id=>/^link-arena-room-[a-z0-9]{6}$/.test(id);
function send(c,m){if(c&&c.ws.readyState===WebSocket.OPEN)c.ws.send(JSON.stringify(m))}
function err(c,type,message){send(c,{t:"error",type,message})}
function disconnect(a,b){if(!a.links.delete(b.id))return;b.links.delete(a.id);send(a,{t:"closed",from:b.id});send(b,{t:"closed",from:a.id})}
server.on("upgrade",(req,socket,head)=>{
 if(req.url!=="/ws"||req.headers.origin!==allowedOrigin||wss.clients.size>=500){socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");return}
 wss.handleUpgrade(req,socket,head,ws=>wss.emit("connection",ws));
});
wss.on("connection",ws=>{
 const c={ws,id:null,links:new Set(),count:0,window:Date.now(),alive:true};
 const deadline=setTimeout(()=>{if(!c.id)ws.close(1008,"Registration required")},10000);
 ws.on("pong",()=>c.alive=true);
 ws.on("error",()=>{});
 ws.on("message",raw=>{
  if(Date.now()-c.window>10000){c.window=Date.now();c.count=0}if(++c.count>200){ws.close(1008,"Rate limit");return}
  let m;try{m=JSON.parse(raw.toString())}catch{return}if(!m||typeof m!=="object")return;
  if(!c.id){
   if(m.t!=="register")return;
   const id=m.id==null?"guest-"+randomUUID():m.id;
   if(typeof id!=="string"||!(isHost(id)||m.id==null)){err(c,"invalid-id","Invalid peer ID");return}
   if(clients.has(id)){err(c,"unavailable-id","Room code already in use");return}
   c.id=id;clients.set(id,c);clearTimeout(deadline);send(c,{t:"ready",id});return
  }
  if(m.t==="ping"){send(c,{t:"pong"});return}
  const other=clients.get(m.to);
  if(m.t==="connect"){
   if(!other||!isHost(other.id)){err(c,"peer-unavailable","Room not found");return}
   if(isHost(c.id)||c.links.size||other.links.size>=3){err(c,"room-full","Room full or already connected");return}
   c.links.add(other.id);other.links.add(c.id);
   send(other,{t:"incoming",from:c.id});send(c,{t:"opened",from:other.id});return
  }
  if(!other||!c.links.has(other.id))return;
  if(m.t==="data")send(other,{t:"data",from:c.id,data:m.data});
  else if(m.t==="close")disconnect(c,other);
 });
 ws.on("close",()=>{clearTimeout(deadline);if(!c.id)return;clients.delete(c.id);for(const id of [...c.links]){const b=clients.get(id);if(b)disconnect(c,b)}});
 const heartbeat=setInterval(()=>{if(!c.alive){ws.terminate();return}c.alive=false;try{ws.ping()}catch{}},30000);
 ws.on("close",()=>clearInterval(heartbeat));
});
server.listen(Number(process.env.PORT)||10000,"0.0.0.0");
