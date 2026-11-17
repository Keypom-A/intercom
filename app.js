let peer;
let call;
let localStream;
let audioTrack;

const statusEl = document.getElementById("status");
const pttBtn = document.getElementById("ptt");
const remoteAudio = document.getElementById("remoteAudio");

function setStatus(text) {
    statusEl.textContent = text;
    console.log(text);
}

async function unlockAudio() {
    try {
        await remoteAudio.play();
    } catch (e) {
        console.log("Audio unlock待機");
    }
}

document.body.addEventListener(
    "touchstart",
    unlockAudio,
    { once: true }
);

async function setupMic() {

    if (localStream) return;

    localStream =
        await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false
        });

    audioTrack =
        localStream.getAudioTracks()[0];

    // 一旦ON
    audioTrack.enabled = true;

    console.log("Mic OK");
}

function enablePTT() {

    if (!audioTrack) return;

    audioTrack.enabled = false;

    pttBtn.disabled = false;

    setStatus("接続完了");
}

function setupCall(callObj) {

    call = callObj;

    call.on("stream", async (remoteStream) => {

        console.log("REMOTE STREAM OK");

        remoteAudio.srcObject = remoteStream;

        try {
            await remoteAudio.play();
            console.log("再生開始");
        } catch (err) {
            console.error(err);
            alert(
                "音声再生エラー\n画面をタップしてから再度試してください"
            );
        }

        enablePTT();
    });

    call.on("close", () => {
        setStatus("接続終了");
    });

    call.on("error", (err) => {
        console.error(err);
        setStatus("通話エラー");
    });
}

document
.getElementById("hostBtn")
.addEventListener("click", async () => {

    const room =
        document.getElementById("roomId")
        .value
        .trim();

    if (!room) {
        alert("ルームIDを入力してください");
        return;
    }

    try {

        await setupMic();

        peer = new Peer(room);

        peer.on("open", () => {
            setStatus(
                "待機中 : " + room
            );
        });

        peer.on("call", (incoming) => {

            incoming.answer(localStream);

            setupCall(incoming);
        });

        peer.on("error", (err) => {
            console.error(err);
            setStatus(
                "Peerエラー: " + err.type
            );
        });

    } catch (err) {

        console.error(err);

        setStatus(
            "マイク取得失敗"
        );
    }
});

document
.getElementById("joinBtn")
.addEventListener("click", async () => {

    const room =
        document.getElementById("roomId")
        .value
        .trim();

    if (!room) {
        alert("ルームIDを入力してください");
        return;
    }

    try {

        await setupMic();

        peer = new Peer();

        peer.on("open", () => {

            setStatus(
                "接続中..."
            );

            const outgoing =
                peer.call(
                    room,
                    localStream
                );

            setupCall(outgoing);
        });

        peer.on("error", (err) => {
            console.error(err);
            setStatus(
                "Peerエラー: " + err.type
            );
        });

    } catch (err) {

        console.error(err);

        setStatus(
            "接続失敗"
        );
    }
});

function startTalk() {

    if (!audioTrack) return;

    audioTrack.enabled = true;

    pttBtn.classList.add("talking");

    setStatus("送信中...");
}

function stopTalk() {

    if (!audioTrack) return;

    audioTrack.enabled = false;

    pttBtn.classList.remove("talking");

    setStatus("接続完了");
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
    "pointercancel",
    stopTalk
);

pttBtn.addEventListener(
    "pointerleave",
    stopTalk
);
