class Command {
  constructor() {
    this._regex = /^$/i;
  }

  match(text) {
    return text.search(this._regex);
  }

  execute(text, tabDebugger, commandContext) {

  }
}

export default Command;