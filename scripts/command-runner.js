import CommandContext from './command-context.js';

class CommandRunner {
  constructor() {
    this._tabDebugger = null;
    this._commandContext = new CommandContext();
    this._commands = new Set();
  }

  setTabDebugger(tabDebugger) {
    this._tabDebugger = tabDebugger;

    tabDebugger.sendCommand('DOM.enable')
      .then(tabDebugger.sendCommand.bind(tabDebugger, 'CSS.enable'))
      .then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument'))
      .then((data) => {
        if(!data.root) {
          throw new Error('Document root not available.');
        }

        this._commandContext.setRootNodeId(data.root.nodeId);
      });
  }

  registerCommand(commandType) {
    this._commands.add(new commandType());
  }

  recognize(text) {
    let matches = [];

    //figure out the order in which commands should be called (must be the same as in the text)
    this._commands.forEach((command) => {
      let position = command.match(text);

      if(position !== -1) {
        matches.push({
          position,
          command
        });
      }
    });

    let tabDebugger = this._tabDebugger;
    let commandContext = this._commandContext;
    let dummyPromise = new Promise((resolve, reject) => {
      resolve();
    });

    return matches
      .sort((a, b) => {
        return a.position - b.position;
      })
      //call next command only after previous one has finished
      .reduce((promise, {command}) => {
        let nextCommand = command.execute.bind(command, text, tabDebugger, commandContext);
        return promise.then(nextCommand);
      }, dummyPromise);
  }

}

export default CommandRunner;