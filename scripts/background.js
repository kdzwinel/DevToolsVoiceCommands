import SpeechRecognition from './speech-recognition.js';
import CommandRunner from './command-runner.js';
import TabDebugger from './tab-debugger.js';
import {getActiveTab} from './helpers/tabs.js';

import NodeInspectionCommand from './commands/node-inspection.js';
import NodeDeletionCommand from './commands/node-deletion.js';
import CSSChangeCommand from './commands/css-change.js';
import CSSGetValueCommand from './commands/css-get-value.js';
import UndoCommand from './commands/undo.js';
import RedoCommand from './commands/redo.js';

function showRecordingIcon() {
  chrome.browserAction.setBadgeText({
    text: '·'
  });
}

function hideRecordingIcon() {
  chrome.browserAction.setBadgeText({
    text:''
  });
}

let speechRecognition = new SpeechRecognition();
let commandRunner = new CommandRunner();

commandRunner.registerCommand(NodeInspectionCommand);
commandRunner.registerCommand(NodeDeletionCommand);
commandRunner.registerCommand(CSSChangeCommand);
commandRunner.registerCommand(CSSGetValueCommand);
commandRunner.registerCommand(UndoCommand);
commandRunner.registerCommand(RedoCommand);

chrome.browserAction.onClicked.addListener(() => {
  if(speechRecognition.isActive()) {
    speechRecognition.stop();
    return;
  }

  let tabDebugger;

  speechRecognition
    .start()
    .then(getActiveTab)
    .then((tab) => {
      tabDebugger = new TabDebugger(tab.id);
      return tabDebugger.connect();
    })
    .then(() => {
      showRecordingIcon();

      commandRunner.setTabDebugger(tabDebugger);

      speechRecognition.onResult.addListener((transcript) => {
        commandRunner.recognize(transcript);
      });
      speechRecognition.onEnd.addListener(() => {
        tabDebugger.disconnect();
        hideRecordingIcon();
      });
    }).catch((error) => {
      if (error == 'not-allowed') {
        chrome.runtime.openOptionsPage();
      }

      if(speechRecognition.isActive()) {
        speechRecognition.stop();
      }

      if(tabDebugger.isConnected()) {
        tabDebugger.disconnect();
      }

      console.log(error);
    });
});