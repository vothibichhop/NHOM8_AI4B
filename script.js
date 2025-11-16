const URL = "https://teachablemachine.withgoogle.com/models/iXHC6tbDr/"; 

let model, webcam, labelContainer, alertContainer;

async function init() {
    try {
        console.log("Đang load mô hình...");
        model = await tmImage.load(URL + "model.json", URL + "metadata.json");
        console.log("Mô hình đã load xong.");

        webcam = new tmImage.Webcam(400, 400, true);
        await webcam.setup();
        console.log("Webcam đã setup.");
        await webcam.play();
        console.log("Webcam đang chạy.");

        document.getElementById("webcam").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        alertContainer = document.getElementById("alert-container");

        window.requestAnimationFrame(loop);
    } catch (err) {
        console.error("Lỗi khi load mô hình hoặc webcam:", err);
        alert("Có lỗi xảy ra! Xem console để biết chi tiết.");
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

let audioPlaying = false;
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    labelContainer.innerHTML = "";
    console.log(prediction); // debug

    let obstacleDetected = false;

    prediction.forEach(p => {
        const pText = document.createElement("div");
        pText.innerText = `${p.className}: ${(p.probability*100).toFixed(2)}%`;
        labelContainer.appendChild(pText);

        if (p.className.toLowerCase().includes("vật cản") && p.probability > 0.8) {
            obstacleDetected = true;
        }
    });

    if (obstacleDetected) {
        alertContainer.innerText = "⚠️ VẬT CẢN!";
        alertContainer.style.backgroundColor = "red";
        playAlert();
    } else {
        alertContainer.innerText = "🎵 Không có vật cản";
        alertContainer.style.backgroundColor = "green";
    }
}

function playAlert() {
    if (audioPlaying) return;
    audioPlaying = true;

    const audio = new Audio("obstacle.mp3");
    audio.play();
    audio.onended = () => { audioPlaying = false; };
}

// Khởi động
init();
