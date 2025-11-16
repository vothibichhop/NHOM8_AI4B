const URL = "hhttps://teachablemachine.withgoogle.com/models/iXHC6tbDr/";

let model, maxPredictions;
let warningActive = false;

async function init() {
    try {
        model = await tmImage.load(URL + "model.json", URL + "metadata.json");
        maxPredictions = model.getTotalClasses();
        document.getElementById("label").innerHTML = "Mô hình đã tải!";
    } catch (e) {
        document.getElementById("label").innerHTML = "❌ Không tải được mô hình!";
        console.error(e);
        return;
    }

    const webcam = document.getElementById("webcam");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcam.srcObject = stream;

        webcam.addEventListener("loadeddata", () => {
            console.log("Webcam đã hoạt động!");
            predict();
        });
    } catch (err) {
        console.error("Lỗi webcam:", err);
        alert("Không bật được webcam. Hãy Allow camera hoặc chạy trang bằng HTTPS.");
    }
}

async function predict() {
    const webcam = document.getElementById("webcam");

    const prediction = await model.predict(webcam);

    // tìm class có probability cao nhất
    let bestLabel = "";
    let bestProb = 0;

    prediction.forEach(p => {
        if (p.probability > bestProb) {
            bestProb = p.probability;
            bestLabel = p.className;
        }
    });

    document.getElementById("label").innerHTML =
        "Nhận diện: <b>" + bestLabel + "</b> (" + Math.round(bestProb * 100) + "%)";

    // Nếu xác suất > 80% và KHÔNG phải lớp an toàn
    if (bestProb > 0.8 && bestLabel !== "Không vật cản") {
        showWarning();
    } else {
        hideWarning();
    }

    requestAnimationFrame(predict);
}

// 🟥 bật cảnh báo
function showWarning() {
    const warningDiv = document.getElementById("warning");
    const sound = document.getElementById("alertSound");

    warningDiv.style.display = "block";

    if (!warningActive) {
        sound.play();
        warningActive = true;
    }
}

// 🟩 tắt cảnh báo
function hideWarning() {
    document.getElementById("warning").style.display = "none";
    warningActive = false;
}

init();


