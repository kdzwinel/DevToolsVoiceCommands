class Command {
  constructor(commandRunner) {
    this._regex = /^$/i;
    this._commandRunner = commandRunner;
  }

  match(text) {
    return text.search(this._regex);
  }

  execute(text, {tabDebugger, rootNodeId, contextNodeId}) {

  }
}

export default Command;