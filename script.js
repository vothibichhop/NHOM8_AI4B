let classifier;
// Link model Teachable Machine online
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/alzMSy7BN/model.json';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

// Âm thanh cho từng vật cản
let sounds = {};

function preload() {
  // Load model từ link online
  classifier = ml5.imageClassifier(imageModelURL);

  // Load âm thanh theo từng loại vật cản
  // 👉 Bạn đổi tên label + file mp3 theo mô hình của bạn
  sounds["Cột điện"]  = loadSound('pttsmaker-file-2025-11-17-16-19-20.mp3');
  sounds["Lan can"]   = loadSound('ttsmaker-file-2025-11-17-16-20-46.mp3');
  sounds["Thùng rác"] = loadSound('ttsmaker-file-2025-11-17-16-22-16.mp3');
}

function setup() {
  createCanvas(320, 260);

  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  flippedVideo = ml5.flipImage(video);

  classifyVideo();
}

function draw() {
  background(0);
  image(flippedVideo, 0, 0);

  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
}

function classifyVideo() {
  flippedVideo = ml5.flipImage(video);
  classifier.classify(flippedVideo, gotResult);
  flippedVideo.remove();
}

function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  label = results[0].label;

  // Nếu có vật cản → phát âm theo label
  if (sounds[label]) {
    playAlertFor(label);
  }

  classifyVideo();
}

// ▶ Phát âm thanh cho từng loại vật cản
function playAlertFor(label) {
  if (!sounds[label].isPlaying()) {
    stopAllSounds();  // không để âm chồng lên nhau
    sounds[label].play();
  }
}

// ⏹ Stop các âm cũ trước khi phát âm mới
function stopAllSounds() {
  for (let key in sounds) {
    if (sounds[key].isPlaying()) {
      sounds[key].stop();
    }
  }
}
