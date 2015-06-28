import SpeechRecognition from './speech-recognition.js';
import CommandRunner from './command-runner.js';
import TabDebugger from './tab-debugger.js';
import {getActiveTab} from './helpers/tabs.js';
import RecordingIcon from './recording-icon.js';

import NodeInspectionCommand from './commands/node-inspection.js';
import NodeDeletionCommand from './commands/node-deletion.js';
import CSSChangeCommand from './commands/css-change.js';
import CSSGetValueCommand from './commands/css-get-value.js';
import UndoCommand from './commands/undo.js';
import RedoCommand from './commands/redo.js';
import TextToSpeech from './text-to-speech.js';

let textToSpeech = new TextToSpeech();
let recordingIcon = new RecordingIcon();
let commandRunner = new CommandRunner();

commandRunner.registerCommand(NodeInspectionCommand);
commandRunner.registerCommand(NodeDeletionCommand);
commandRunner.registerCommand(CSSChangeCommand);
commandRunner.registerCommand(CSSGetValueCommand);
commandRunner.registerCommand(UndoCommand);
commandRunner.registerCommand(RedoCommand);

let speechRecognition = new SpeechRecognition();
let tabDebugger = null;

speechRecognition.onResult.addListener((transcript) => {
  commandRunner.recognize(transcript).then((result) => {
    if (result) {
      textToSpeech.speak(result);
    }
  }).catch((error) => {
    if (error) {
      textToSpeech.speak(error);
    }
  });
});

speechRecognition.onEnd.addListener(() => {
  if (tabDebugger && tabDebugger.isConnected()) {
    tabDebugger.disconnect();
  }
  recordingIcon.hide();
});

chrome.browserAction.onClicked.addListener(() => {
  if (speechRecognition.isActive()) {
    speechRecognition.stop();
    return;
  }

  speechRecognition
    .start()
    .then(getActiveTab)
    .then((tab) => {
      tabDebugger = new TabDebugger(tab.id);
      tabDebugger.onDisconnect.addListener(() => {
        speechRecognition.stop();
      });
      return tabDebugger.connect();
    })
    .then(() => {
      recordingIcon.show();
      commandRunner.setTabDebugger(tabDebugger);
    }).catch((error) => {
      if (error == 'not-allowed') {
        chrome.runtime.openOptionsPage();
      }

      if (speechRecognition.isActive()) {
        speechRecognition.stop();
      }

      console.log(error);
    });
});