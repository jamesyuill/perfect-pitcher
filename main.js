import { pickSong } from './utils/pickSong';
import * as Tone from 'tone';
import { synth } from './synth/synth';

let noteName;
let audioContext = null;
let analyser = null;
let isListening = false;
let noteRecorded = false;
let counter = 0;
let userGuessArray = [];
let userGuess;

const startGameBtn = document.getElementById('start-game-btn');
const gameBody = document.getElementById('gamebody');
const questionDiv = document.getElementById('question');
const startGameDiv = document.getElementById('start-game');
const guessButtonsDiv = document.getElementById('guess-buttons');
const noteValueDiv = document.getElementById('noteValue');
const userGuessDiv = document.getElementById('userGuess');
const userButtons = document.getElementById('userbuttons');

startGameBtn.addEventListener('click', startGame);

function startGame() {
  const song = pickSong();
  startGameDiv.removeChild(startGameBtn);
  displayQuestion(song);
  guessButtons();
}

function displayQuestion(song) {
  questionDiv.innerText = song.question;
}

function guessButtons() {
  const makeAGuessBtn = document.createElement('button');
  makeAGuessBtn.innerText = 'Sing the note!';

  guessButtonsDiv.appendChild(makeAGuessBtn);

  makeAGuessBtn.addEventListener('click', startListening);
}

function displayGuess(guess) {
  userGuessDiv.innerText = `You think that note was ${guess}? Are you correct...`;

  const playGuessedNote = document.createElement('button');
  playGuessedNote.innerText = `Play a ${guess} for reference`;
  playGuessedNote.addEventListener('click', () => {
    let guessWithOctave;
    if (guess === 'A' || guess === 'B') {
      guessWithOctave = guess + '5';
    } else {
      guessWithOctave = guess + '4';
    }
    synth.triggerAttackRelease(guessWithOctave, '16n');
  });

  const userUse = document.createElement('button');
  userUse.innerText = 'Use Guess';

  userUse.addEventListener('click', checkAnswer);

  const userRetry = document.createElement('button');
  userRetry.innerText = 'Retry Guess';

  userRetry.addEventListener('click', startListening);

  userButtons.appendChild(playGuessedNote);
  userButtons.appendChild(userUse);
  userButtons.appendChild(userRetry);
}

function checkAnswer() {}

async function startListening() {
  if (!isListening) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      // analyser.connect(audioContext.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      isListening = true;

      function updatePitch() {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (const amplitude of dataArray) {
          sum += amplitude * amplitude;
        }

        const volume = Math.sqrt(sum / dataArray.length);
        console.log(volume);
        const maxFrequency = indexOfMax(dataArray);
        const pitch =
          (maxFrequency * audioContext.sampleRate) / analyser.fftSize;
        // pitchValue.textContent = pitch.toFixed(2) + ' Hz';

        // Convert pitch to a musical note (simplified)
        let note = frequencyToNote(pitch);

        if (!note) {
          noteValueDiv.textContent = '---';
        } else {
          noteValueDiv.textContent = note;
        }

        if (note && volume > 40) {
          userGuessArray.push(note);
        }

        if (userGuessArray.length > 0) {
          let obj = {};
          let el;
          let max = 0;
          for (let i = 0; i < userGuessArray.length; i++) {
            if (!obj[userGuessArray[i]]) obj[userGuessArray[i]] = 1;
            else obj[userGuessArray[i]]++;
          }

          for (const i in obj) {
            if (max < obj[i]) {
              max = obj[i];
              el = i;
            }
          }

          userGuess = el;
          noteRecorded = true;
          userGuessArray = [];
        }

        // if (!noteReached) {
        //   if (noteName === 'F#' && volume > 35) {
        //     resultDiv.innerText = 'Access Granted';
        //     noteReached = true;
        //   } else {
        //     resultDiv.innerText = 'Access Denied';
        //   }
        // }

        // if (noteRecorded && counter === 0) {
        //   enterDiv.appendChild(enterBtn);
        //   counter++;
        //   stopListening();
        // }
        if (noteRecorded) {
          stopListening();
          displayGuess(userGuess);
        } else {
          requestAnimationFrame(updatePitch);
        }
      }

      updatePitch();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }
}

function stopListening() {
  if (isListening) {
    audioContext.close().then(() => {
      isListening = false;
    });
  }
}

function indexOfMax(arr) {
  let max = 0;
  let maxIndex = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
      maxIndex = i;
    }
  }
  return maxIndex;
}

function frequencyToNote(frequency) {
  const A4Frequency = 440; // A4 is 440 Hz
  const semitoneRatio = Math.pow(2, 1 / 12);
  const semitonesAboveA4 = 12 * Math.log2(frequency / A4Frequency);
  const noteNames = [
    'A',
    'A#',
    'B',
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
  ];
  const noteIndex = Math.round(semitonesAboveA4);
  noteName = noteNames[(noteIndex + 12) % 12];
  //   const octave = Math.floor((noteIndex + 12) / 12);
  return noteName;
}
