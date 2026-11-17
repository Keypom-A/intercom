let peer;
let call;

let localStream;

let audioContext;
let gainNode;
let destination;

const statusEl =
document.getElementById("status");

const pttBtn =
document.getElementById("ptt");

const unlockBtn =
document.getElementById("unlockBtn");

const remoteAudio =
document.getElementById("remoteAudio");

function status(text){

console.log(text);

statusEl.textContent =
text;
}

async function setupMic(){

if(localStream)
return;

const rawStream =
await navigator.mediaDevices.getUserMedia({

audio:{
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
},

video:false

});

audioContext =
new (
window.AudioContext ||
window.webkitAudioContext
)();

const source =
audioContext
.createMediaStreamSource(
rawStream
);

gainNode =
audioContext
.createGain();

gainNode.gain.value = 0;

destination =
audioContext
.createMediaStreamDestination();

source.connect(
gainNode
);

gainNode.connect(
destination
);

localStream =
destination.stream;

}

unlockBtn.addEventListener(

"click",

async ()=>{

try{

if(audioContext){

await audioContext.resume();

}

await remoteAudio.play();

status(
"音声初期化完了"
);

}catch(err){

console.error(err);

}

}
);

function setupCall(target){

call = target;

call.on(

"stream",

async remoteStream=>{

console.log(
"REMOTE STREAM"
);

remoteAudio.srcObject =
remoteStream;

try{

await remoteAudio.play();

status(
"接続完了"
);

}catch(err){

console.error(err);

status(
"再生エラー"
);

}

pttBtn.disabled =
false;

}
);

call.on(
"close",
()=>status("切断")
);

call.on(
"error",
err=>{

console.error(err);

status("通話エラー");

}
);

}

document
.getElementById("hostBtn")
.addEventListener(

"click",

async ()=>{

const room =
document
.getElementById("roomId")
.value
.trim();

if(!room){

alert("ルームID");

return;

}

await setupMic();

peer =
new Peer(room);

peer.on(
"open",
()=>status("待機中")
);

peer.on(
"call",
incoming=>{

incoming.answer(
localStream
);

setupCall(
incoming
);

}
);

peer.on(
"error",
err=>{

console.error(err);

status(
err.type
);

}
);

}
);

document
.getElementById("joinBtn")
.addEventListener(

"click",

async ()=>{

const room =
document
.getElementById("roomId")
.value
.trim();

if(!room){

alert("ルームID");

return;

}

await setupMic();

peer =
new Peer();

peer.on(
"open",
()=>{

const outgoing =
peer.call(
room,
localStream
);

setupCall(
outgoing
);

}
);

peer.on(
"error",
err=>{

console.error(err);

status(
err.type
);

}
);

}
);

function startTalk(){

if(!gainNode)
return;

gainNode.gain.value = 1;

pttBtn.classList.add(
"talking"
);

status(
"送信中"
);

}

function stopTalk(){

if(!gainNode)
return;

gainNode.gain.value = 0;

pttBtn.classList.remove(
"talking"
);

status(
"接続完了"
);

}

pttBtn.addEventListener(
"pointerdown",
startTalk
);

pttBtn.addEventListener(
"pointerup",
stopTalk
);

pttBtn.addEventListener(
"pointerleave",
stopTalk
);

pttBtn.addEventListener(
"pointercancel",
stopTalk
);
