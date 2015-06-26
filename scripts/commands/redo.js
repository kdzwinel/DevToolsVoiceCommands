import Command from '../command.js';

class RedoCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /redo/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.redoLastAction();
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  redoLastAction() {
    console.log('undo');

    let tabDebugger = this._commandRunner.getTabDebugger();

    return tabDebugger.sendCommand('DOM.redo');
  }
}

export default RedoCommand;