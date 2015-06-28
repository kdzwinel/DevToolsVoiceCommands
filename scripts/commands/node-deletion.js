import Command from '../command.js';

class NodeDeletionCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(delete|remove) it/i;
  }

  execute(text, tabDebugger, commandContext) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.removeNode(commandContext.getContextNodeId(), tabDebugger);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  removeNode(nodeId, tabDebugger) {
    console.log('NodeDeletionCommand', nodeId);

    if(!nodeId) {
      throw new Error('Invalid context.');
    }

    return tabDebugger.sendCommand('DOM.removeNode', {
      nodeId
    }).catch(() => {
      throw new Error('Node not found.');
    });
  }
}

NodeDeletionCommand.description = `Remove currently inspected node with "remove it" or "delete it".`;

export default NodeDeletionCommand;