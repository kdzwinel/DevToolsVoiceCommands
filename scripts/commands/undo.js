import Command from '../command.js';

class UndoCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /undo/i;
  }

  execute(text, tabDebugger, commandContext) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.undoLastAction(tabDebugger);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  undoLastAction(tabDebugger) {
    console.log('undo');

    return tabDebugger.sendCommand('DOM.undo');
  }
}

UndoCommand.description = `Undo last command with "undo".`;

export default UndoCommand;