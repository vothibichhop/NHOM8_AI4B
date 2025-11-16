const USE_URL_MODEL = true; // true: dùng URL; false: dùng local folder "model/"
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/iXHC6tbDr/"; // <-- sửa chỗ này

// Nếu dùng local model, đặt folder 'model/' nằm cùng cấp với index.html
const LOCAL_MODEL_PATH = "model/";

// Tên lớp (class) mà mô hình của bạn đã train. PHẢI KHỚP TÊN trong metadata.json.
// Bạn có thể dùng tên có dấu hoặc không dấu, nhưng script so sánh toLowerCase()
const TARGET_CLASSES = [
  { name: "cột điện", sound: "sound/cotdien.mp3" },
  { name: "lan can",  sound: "sound/lancan.mp3"  },
  { name: "rào chắn", sound: "sound/raochan.mp3" },
  { name: "thùng rác", sound: "sound/thungrac.mp3" }
];

// Ngưỡng xác suất để coi là "phát hiện" (0..1)
const DETECT_THRESHOLD = 0.65;
// ------------------------------------------------------

let model = null;
let webcam = null;
let rafId = null;
let audioPlaying = false;
let lastDetected = null;

const webcamContainer = document.getElementById("webcam-container");
const labelsDiv = document.getElementById("labels");
const alertDiv = document.getElementById("alert");
const statusDiv = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// load model (URL or local)
async function loadModel() {
  statusDiv.innerText = "Trạng thái: Đang load mô hình...";
  try {
    const base = USE_URL_MODEL ? MODEL_URL : LOCAL_MODEL_PATH;
    model = await tmImage.load(base + "model.json", base + "metadata.json");
    statusDiv.innerText = "Trạng thái: Mô hình đã load.";
    console.log("Model loaded:", model);
  } catch (e) {
    console.error("Lỗi load model:", e);
    statusDiv.innerText = "Lỗi: không thể load mô hình. Xem console.";
    throw e;
  }
}

async function startWebcam() {
  if (!model) {
    await loadModel();
  }

  statusDiv.innerText = "Trạng thái: Khởi tạo webcam...";
  try {
    webcam = new tmImage.Webcam(400, 300, true); // width, height, flip
    await webcam.setup(); // yêu cầu quyền camera
    await webcam.play();
    webcamContainer.innerHTML = ""; // clear
    webcamContainer.appendChild(webcam.canvas); // append canvas vào div
    statusDiv.innerText = "Trạng thái: Webcam chạy. Bắt đầu dự đoán...";
    // start loop
    loop();
  } catch (err) {
    console.error("Lỗi webcam:", err);
    statusDiv.innerText = "Lỗi: không thể truy cập webcam. Kiểm tra quyền.";
    throw err;
  }
}

async function stopWebcam() {
  if (webcam) {
    webcam.stop();
    webcamContainer.innerHTML = "";
    webcam = null;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  statusDiv.innerText = "Trạng thái: Dừng webcam.";
  alertDiv.innerText = "🎵 Không có vật cản";
  alertDiv.style.backgroundColor = "green";
}

async function loop() {
  if (!webcam) return;
  webcam.update(); // cập nhật frame
  await predictOnce();
  rafId = requestAnimationFrame(loop);
}

async function predictOnce() {
  if (!model || !webcam) return;
  try {
    const preds = await model.predict(webcam.canvas);
    // preds là mảng {className, probability}
    labelsDiv.innerHTML = ""; // xóa cũ
    // hiển thị tất cả class
    preds.forEach(p => {
      const line = document.createElement("div");
      line.innerText = `${p.className}: ${(p.probability*100).toFixed(1)}%`;
      labelsDiv.appendChild(line);
    });

    // kiểm tra target classes
    let detected = null;
    for (const p of preds) {
      const nm = p.className.toLowerCase();
      if (p.probability >= DETECT_THRESHOLD) {
        // tìm xem có nằm trong TARGET_CLASSES
        const target = TARGET_CLASSES.find(t => nm.includes(t.name.toLowerCase()));
        if (target) {
          detected = { name: target.name, sound: target.sound, prob: p.probability };
          break;
        }
      }
    }

    if (detected) {
      // thay đổi giao diện cảnh báo
      alertDiv.innerText = `⚠️ ${detected.name.toUpperCase()} (${(detected.prob*100).toFixed(0)}%)`;
      alertDiv.style.backgroundColor = "red";
      document.body.style.backgroundColor = "#fff0f0";
      // tránh chơi lặp liên tục cùng âm thanh
      if (lastDetected !== detected.name) {
        playSoundFor(detected);
        lastDetected = detected.name;
      }
    } else {
      alertDiv.innerText = "🎵 Không có vật cản";
      alertDiv.style.backgroundColor = "green";
      document.body.style.backgroundColor = "#f2f2f2";
      lastDetected = null;
    }

  } catch (err) {
    console.error("Lỗi predict:", err);
    statusDiv.innerText = "Lỗi khi dự đoán. Xem console.";
  }
}

function playSoundFor(detected) {
  // Nếu có file âm thanh đặt đúng đường dẫn, phát file đó.
  // Ngược lại fallback sang Text-to-Speech.
  if (!detected || !detected.sound) return;

  // Kiểm tra tồn tại file âm thanh bằng cách tạo audio rồi bắt lỗi khi phát
  try {
    const audio = new Audio(detected.sound);
    audio.play().then(()=> {
      audioPlaying = true;
      audio.onended = () => { audioPlaying = false; };
    }).catch(err => {
      console.warn("Không thể phát file âm thanh (sẽ dùng TTS):", err);
      speakFallback(detected.name);
    });
  } catch (e) {
    console.warn("Lỗi tạo audio, dùng TTS:", e);
    speakFallback(detected.name);
  }
}

function speakFallback(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "vi-VN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ------------- event handlers -------------
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  try {
    await startWebcam();
  } catch(e) { console.error(e); startBtn.disabled = false; }
});

stopBtn.addEventListener("click", async () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  await stopWebcam();
});

// Khởi tạo trạng thái ban đầu
stopBtn.disabled = true;
statusDiv.innerText = "Sẵn sàng. Nhấn Start để bật webcam và load mô hình.";
console.log("Ready.");
