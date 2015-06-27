import Command from '../command.js';

class NodeDeletionCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(delete|remove) it/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.removeNode(this._commandRunner.getContextNodeId());
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  removeNode(nodeId) {
    console.log('removeNode', nodeId);

    if(!nodeId) {
      throw new Error('Invalid node.');
    }

    let tabDebugger = this._commandRunner.getTabDebugger();

    return tabDebugger.sendCommand('DOM.removeNode', {
      nodeId
    }).catch(() => {
      chrome.tts.speak('Node not found.');
      throw new Error('Node not found.');
    });
  }
}

NodeDeletionCommand.description = `Remove currently inspected node with "remove it" or "delete it".`;

export default NodeDeletionCommand;