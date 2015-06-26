import Command from '../command.js';

class UndoCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /undo/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.undoLastAction();
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  undoLastAction() {
    console.log('undo');

    let tabDebugger = this._commandRunner.getTabDebugger();

    return tabDebugger.sendCommand('DOM.undo');
  }
}

export default UndoCommand;