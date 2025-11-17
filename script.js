let classifier;
let video;
let label = "";

// URL model Teachable Machine (vật cản)
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/alzMSy7BN/';

// Âm thanh cho từng vật cản
let sounds = {};

function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');

  // Load âm thanh cảnh báo cho từng vật cản
  sounds["Cột điện"]  = loadSound('ttsmaker-file-2025-11-17-16-19-20.mp3');
  sounds["Lan can"]   = loadSound('ttsmaker-file-2025-11-17-16-20-46.mp3');
  sounds["Thùng rác"] = loadSound('ttsmaker-file-2025-11-17-16-22-16.mp3');
}

function setup() {
  const canvas = createCanvas(320, 260);
  canvas.parent('canvas-container');

  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  classifyVideo();
}

function draw() {
  background(0);

  // Lật video ngang
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  // Hiển thị nhãn vật cản
  fill(255, 0, 0);
  textSize(18);
  textAlign(CENTER);
  text(label, width / 2, height - 10);
}

// Classify video frame
function classifyVideo() {
  classifier.classify(video, gotResult);
}

// Xử lý kết quả
function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  label = results[0].label;

  // Phát âm thanh nếu vật cản được nhận diện
  if (sounds[label]) {
    playAlertFor(label);
  }

  classifyVideo(); // classify liên tục
}

function playAlertFor(label) {
  if (!sounds[label].isPlaying()) {
    stopAllSounds();
    sounds[label].play();
  }
}

function stopAllSounds() {
  for (let key in sounds) {
    if (sounds[key].isPlaying()) {
      sounds[key].stop();
    }
  }
}

