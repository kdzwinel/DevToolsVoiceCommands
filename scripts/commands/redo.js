import Command from '../command.js';

class RedoCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /redo/i;
  }

  execute(text, tabDebugger, commandContext) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.redoLastAction(tabDebugger);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  redoLastAction(tabDebugger) {
    console.log('RedoCommand');

    return tabDebugger.sendCommand('DOM.redo');
  }
}

RedoCommand.description = `Redo last command with "redo".`;

export default RedoCommand;