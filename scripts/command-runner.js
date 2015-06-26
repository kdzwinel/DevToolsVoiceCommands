class CommandRunner {
  constructor() {
    this._tabDebugger = null;
    this._rootNodeId = null;
    this._contextNodeId = null;
    this._commands = new Set();
  }

  setTabDebugger(tabDebugger) {
    this._tabDebugger = tabDebugger;

    tabDebugger.sendCommand('DOM.enable')
      .then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument'))
      .then((data) => {
        if(!data.root) {
          throw new Error('Document root not available.');
        }

        this._rootNodeId = data.root.nodeId;
      });
  }

  getTabDebugger() {
    return this._tabDebugger;
  }

  getContextNodeId() {
    return this._contextNodeId;
  }

  setContextNodeId(id) {
    this._contextNodeId = id;
  }

  getRootNodeId() {
    return this._rootNodeId;
  }

  registerCommand(commandType) {
    this._commands.add(new commandType(this));
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

    return matches
      .sort((a, b) => {
        return a.position - b.position;
      })
      //call next command only after previous one has finished
      .reduce((promise, {command}) => {
        if(!promise) {
          return command.execute(text);
        }

        return promise.then(command.execute.bind(command, text));
      }, null);
  }

}

export default CommandRunner;