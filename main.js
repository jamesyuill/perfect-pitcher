import { pickSong } from './utils/pickSong';
import * as Tone from 'tone';
import { synth } from './synth/synth';

let noteName;
let audioContext = null;
let analyser = null;
let isListening = false;
let noteRecorded = false;
let gameStarted = false;
let userGuessArray = [];
let userGuess;
let song;
let userScore = 0;

const startGameBtn = document.getElementById('start-game-btn');
const scoreboardDiv = document.getElementById('scoreboard');
const gameBody = document.getElementById('gamebody');
const questionDiv = document.getElementById('question');
const startGameDiv = document.getElementById('start-game');
const guessButtonsDiv = document.getElementById('guess-buttons');
const noteValueDiv = document.getElementById('noteValue');
const userGuessDiv = document.getElementById('userGuess');
const userButtons = document.getElementById('userbuttons');
const answerDiv = document.getElementById('answer');
const refDiv = document.getElementById('refDiv');
const nextQuestionDiv = document.getElementById('nextquestion');

//Creating Globally Available DOM Elements
const makeAGuessBtn = document.createElement('button');
const playGuessedNote = document.createElement('button');
const userUse = document.createElement('button');
const userRetry = document.createElement('button');
const nextQuestion = document.createElement('button');

startGameBtn.addEventListener('click', () => {
  startGameDiv.removeChild(startGameBtn);
  startGame();
  gameStarted = true;
});

function startGame() {
  if (gameStarted) {
    resetPage();
  }
  scoreboardDiv.innerText = `Score: ${userScore}`;
  song = pickSong();
  displayQuestion(song);
  guessButtons();
}

function displayQuestion(song) {
  questionDiv.style.visibility = 'visible';

  questionDiv.innerText = `
  ${song.artist}: ${song.title}\n
  ${song.question}`;
}

function guessButtons() {
  makeAGuessBtn.innerText = 'Sing the note!';

  guessButtonsDiv.appendChild(makeAGuessBtn);

  makeAGuessBtn.addEventListener('click', startListening);
}

function displayGuess(guess) {
  userGuessDiv.innerText = `So you think that note was ${guess}?`;

  playGuessedNote.innerText = `Play a ${guess} for reference`;
  playGuessedNote.addEventListener('click', () => {
    let guessWithOctave;
    if (guess === 'A' || guess === 'B') {
      guessWithOctave = guess + '5';
    } else {
      guessWithOctave = guess + '4';
    }
    Tone.start();
    synth.triggerAttackRelease(guessWithOctave, '16n');
  });

  userUse.innerText = 'Use Guess';

  userUse.addEventListener('click', () => {
    checkAnswer(song, guess);
  });

  userRetry.innerText = 'Retry Guess';

  refDiv.appendChild(playGuessedNote);
  userButtons.appendChild(userUse);
  userButtons.appendChild(userRetry);
  userRetry.addEventListener('click', () => {
    refDiv.removeChild(playGuessedNote);
    userButtons.removeChild(userUse);
    userButtons.removeChild(userRetry);
    userGuessDiv.innerText = ``;
    answerDiv.innerText = ``;
    startListening();
  });
}

function checkAnswer(song, guess) {
  if (song.noteToGuess === guess) {
    displayAnswer(true);
  } else {
    displayAnswer(false);
  }
}

function displayAnswer(answer) {
  if (answer) {
    answerDiv.classList = 'correct';
    answerDiv.innerText = `Congratulations BRO!`;
    userScore++;
  } else {
    answerDiv.classList = 'wrong';
    answerDiv.innerText = `You is WRONG!\nThe correct answer was ${song.noteToGuess}`;
  }

  nextQuestion.innerText = 'Next Question';
  nextQuestion.addEventListener('click', startGame);

  nextQuestionDiv.appendChild(nextQuestion);
}

function resetPage() {
  userGuessDiv.innerText = ``;
  answerDiv.innerText = ``;

  noteValueDiv.textContent = '';
  guessButtonsDiv.removeChild(makeAGuessBtn);
  refDiv.removeChild(playGuessedNote);
  userButtons.removeChild(userUse);
  userButtons.removeChild(userRetry);
  nextQuestionDiv.removeChild(nextQuestion);
}

async function startListening() {
  noteRecorded = false;
  userGuess = '';

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

        if (note && volume > 33) {
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
