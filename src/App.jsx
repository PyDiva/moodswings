import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

// Put your mp3 files in /public/songs/ with these names
const SONGS = {
  happy: "/songs/happy.mp3",
  laughing: "/songs/laughing.mp3",
  sad: "/songs/sad.mp3",
  crying: "/songs/crying.mp3",
  shocked: "/songs/shocked.mp3",
  angry: "/songs/angry.mp3",
  fearful: "/songs/fearful.mp3",
  neutral: "/songs/neutral.mp3",
};

const EMOJI = {
  happy: "😊", laughing: "😂", sad: "😢", crying: "😭",
  shocked: "😱", angry: "😠", fearful: "😨", neutral: "😐",
};

const RAW = ["happy", "sad", "angry", "fearful", "surprised", "neutral"];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Lower thresholds so it reacts easily (neutral no longer wins every time)
function classify(e, landmarks) {
  const m = landmarks.getMouth();
  const open = dist(m[14], m[18]) / dist(m[0], m[6]);

  if (e.happy > 0.5 && open > 0.25) return "laughing";
  if (e.happy > 0.35) return "happy";
  if (e.surprised > 0.35) return "shocked";
  if (e.sad > 0.7) return "crying";
  if (e.sad > 0.3) return "sad";
  if (e.angry > 0.35) return "angry";
  if (e.fearful > 0.3) return "fearful";
  return "neutral";
}

export default function App() {
  const videoRef = useRef(null);
  const audioRef = useRef(new Audio());
  const streakRef = useRef({ emotion: null, count: 0 });
  const currentRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [scores, setScores] = useState({});
  const [status, setStatus] = useState("press start ♡");
  const [playing, setPlaying] = useState("nothing yet");
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const playFor = (emo) => {
    if (currentRef.current === emo) return;
    currentRef.current = emo;
    const audio = audioRef.current;
    audio.src = SONGS[emo];
    audio.loop = true;
    setPlaying(`${emo}.mp3`);
    audio.play().catch(() => setStatus("add mp3 files to public/songs"));
  };

  const start = async () => {
    try {
      setStatus("loading models...");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStarted(true);
      setStatus("looking for your face...");
    } catch (err) {
      console.error(err);
      setStatus("camera/model error - see console (F12)");
    }
  };

  useEffect(() => {
    if (!started) return;
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.3,
    });

    const id = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const result = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!result) {
        setStatus("no face found - move closer & add light");
        return;
      }
      setStatus("detecting ♡");
      setScores(result.expressions);

      const emo = classify(result.expressions, result.landmarks);
      setEmotion(emo);

      // switch song only after the same emotion shows 3 times in a row
      const s = streakRef.current;
      s.count = s.emotion === emo ? s.count + 1 : 1;
      s.emotion = emo;
      if (s.count >= 3) playFor(emo);
    }, 400);

    return () => clearInterval(id);
  }, [started]);

  return (
    <div className="stage">
      <span className="heart h1">♥</span>
      <span className="heart h2">♥</span>
      <span className="heart h3">♥</span>
      <span className="heart h4">♥</span>

      <div className="window">
        <div className="titlebar">
          <span>♥ moodswings.exe</span>
          <span className="btns"><i>_</i><i>□</i><i>x</i></span>
        </div>

        <div className="body">
          <div className="cam">
            <video ref={videoRef} muted playsInline />
            {!started && <div className="cover">( ˘ ³˘)♡</div>}
          </div>

          <div className="mood">
            <div className="emoji">{EMOJI[emotion]}</div>
            <div className="label">{emotion}</div>
          </div>

          <div className="card">
            <div className="card-title">♪ now playing</div>
            <div className="song">{playing}</div>
            <label className="vol">
              vol
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="bars">
            {RAW.map((k) => (
              <div className="bar-row" key={k}>
                <span>{k}</span>
                <div className="bar">
                  <div style={{ width: `${Math.round((scores[k] || 0) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {!started && (
            <button className="start" onClick={start}>▶ start</button>
          )}
          <p className="status">{status}</p>
        </div>
      </div>
    </div>
  );
}