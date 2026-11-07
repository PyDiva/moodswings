# MoodSwings 🎭

A cute pixel-style web app that detects your facial emotion through the
webcam and plays a matching song.

## Features
- Real-time face emotion detection in the browser
- 8 moods: happy, laughing, sad, crying, shocked, angry, fearful, neutral
- A different song plays for each mood
- Live emotion score bars and a volume slider
- Pink pixel-art design

## Built with
- React + Vite
- face-api.js (@vladmandic/face-api)
- JavaScript, HTML5, CSS

## How to run
```bash
npm install
npm run dev
```
Then open http://localhost:5173/ in Chrome, click start and allow the camera.

## Songs
The songs are not included in this repository. Add your own mp3 files to
`public/songs/` with these exact names:

happy.mp3, laughing.mp3, sad.mp3, crying.mp3,
shocked.mp3, angry.mp3, fearful.mp3, neutral.mp3

## How it works
face-api detects your face and gives scores for 7 basic expressions.
Laughing is guessed from a happy face with an open mouth, and crying from
a very high sad score. The song changes after the same mood is seen
a few times in a row.

## Author
Manasa Vernekar