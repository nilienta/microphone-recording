import { pinch } from './pinch.js';
import { sliceSound } from './slice-sound.js';

let mediaRecorder;
let mediaStream;
const audioSources = [];
let audioChunks = [];

const shiftSliderSpeed = document.getElementById('shiftSliderSpeed');
const shiftSliderPinch = document.getElementById('shiftSliderPinch');
const startButton = document.querySelector('#startButton');
const stopButton = document.querySelector('#stopButton');
const valuePinch = document.getElementById('valuePinch');
const valueSpeed = document.getElementById('valueSpeed');
const playSound = document.getElementById('playSound');

const audioContext = new AudioContext();

shiftSliderSpeed.addEventListener('change', () => {
  valueSpeed.innerText = 'Speed ' + shiftSliderSpeed.value;
});
shiftSliderPinch.addEventListener('change', () => {
  valuePinch.innerText = 'Pinch ' + shiftSliderPinch.value;
});

startButton.addEventListener('click', () => {
  audioChunks = [];
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(startRecording)
    .catch(console.error);
});

stopButton.addEventListener('click', () => {
  mediaRecorder.stop();
  mediaRecorder.addEventListener('stop', () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    const blob = new Blob(audioChunks);
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(blob);
    fileReader.onloadend = () => {
      const arrayBuffer = fileReader.result;
      audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        soundProcessing(audioSource, Number(shiftSliderSpeed.value));
      });
    };
  });
  playSound.disabled = false;
});

const gainNodes = [];
let finallyAudio = null;
playSound.addEventListener('click', () => {
  finallyAudio && finallyAudio[0].start();
  playSound.disabled = true;
});

const startRecording = (stream) => {
  mediaStream = stream;
  const options = { mimeType: 'audio/webm' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.addEventListener('dataavailable', (event) => {
    audioChunks.push(event.data);
  });

  mediaRecorder.start();
};

const soundProcessing = async (audioSource, speedFactor = 1) => {
  const audioChunks = sliceSound(6, audioSource.buffer, audioContext);

  const audioNode = audioContext.createChannelMerger(2);
  const audioRenderNode = audioContext.createGain();
  audioNode.connect(audioRenderNode);
  audioRenderNode.connect(audioContext.destination);

  for (let i = 0; i < audioChunks.length; i++) {
    let source = audioChunks[i];
    source.playbackRate.value = speedFactor;
    const jungle = pinch(source, audioContext);
    jungle.setPitchOffset(Number(shiftSliderPinch.value) - 1);
    source.connect(jungle.input);
    if (i !== 0) {
      audioChunks[i - 1].addEventListener('ended', () => {
        audioChunks[i].start();
      });
    }
    audioSources.push(source);
    gainNodes.push(jungle.input);
    finallyAudio = audioSources;
    jungle.output.connect(audioNode);
  }
};
