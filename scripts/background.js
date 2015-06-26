import SpeechRecognition from './speech-recognition.js';
import CommandRunner from './command-runner.js';
import TabDebugger from './tab-debugger.js';
import {getActiveTab} from './helpers.js';

import NodeInspectionCommand from './commands/node-inspection.js';
import NodeDeletionCommand from './commands/node-deletion.js';
import CSSChangeCommand from './commands/css-change.js';
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

//TODO remove me
window.cr = commandRunner;

commandRunner.registerCommand(NodeInspectionCommand);
commandRunner.registerCommand(NodeDeletionCommand);
commandRunner.registerCommand(CSSChangeCommand);
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
      //TODO remove
      window.td = tabDebugger;
      return tabDebugger.connect();
    })
    .then(() => {
      showRecordingIcon();

      commandRunner.setTabDebugger(tabDebugger);

      speechRecognition.onResult.addListener((transcript) => {
        commandRunner.recognize(transcript);
      });
      speechRecognition.onEnd.addListener(() => {
        //TODO add
        //tabDebugger.disconnect();
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