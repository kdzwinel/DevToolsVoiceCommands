import NodeInspectionCommand from './lib/commands/node-inspection.js';
import NodeDeletionCommand from './lib/commands/node-deletion.js';
import CSSChangeCommand from './lib/commands/css-change.js';
import CSSGetValueCommand from './lib/commands/css-get-value.js';
import UndoCommand from './lib/commands/undo.js';
import RedoCommand from './lib/commands/redo.js';

function initSpeechRecognition() {
  let recognition = new webkitSpeechRecognition();
  let errorNode = document.querySelector('.error');
  let loadingScreen = document.querySelector('.loading');
  let askScreen = document.querySelector('.ask');
  let successScreen = document.querySelector('.success');

  recognition.onstart = () => {
    loadingScreen.hidden = true;
    askScreen.hidden = true;
    successScreen.hidden = false;

    recognition.stop();
  };
  recognition.onerror = (event) => {
    errorNode.innerText = "Ups! Something went wrong, we got this error back: " + event.error;
  };

  recognition.start();

  setTimeout(() => {
    if(!loadingScreen.hidden) {
      loadingScreen.hidden = true;
      askScreen.hidden = false;
    }
  }, 300);
}

function initListOfVoices() {
  let voiceSelect = document.querySelector('#voice');

  voiceSelect.addEventListener('change', () => {
    let voiceName = voiceSelect.value;

    if(voiceName !== '') {
      localStorage.setItem('voiceName', voiceName);
      chrome.tts.speak(voiceName + ' voice selected.', {voiceName})
    } else {
      localStorage.removeItem('voiceName');
      chrome.tts.speak('Default voice selected.');
    }
  });

  chrome.tts.getVoices((list) => {
    list.filter((voice) => {
      return (voice.lang.substr(0,3) === 'en-');
    }).forEach((voice) => {
      let option = document.createElement('option');
      option.innerText = voice.voiceName;

      if(voice.voiceName === localStorage.voiceName) {
        option.selected = true;
      }

      voiceSelect.appendChild(option);
    });
  });
}

function initListOfCommands() {
  let commandsList = document.querySelector('#commands');

  [
    NodeInspectionCommand,
    NodeDeletionCommand,
    CSSChangeCommand,
    CSSGetValueCommand,
    UndoCommand,
    RedoCommand
  ].forEach((command) => {
      let li = document.createElement('li');
      li.innerText = command.description;

      commandsList.appendChild(li);
    });
}

initSpeechRecognition();
initListOfVoices();
initListOfCommands();