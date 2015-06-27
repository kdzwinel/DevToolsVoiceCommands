import Command from '../command.js';
import {toCSSProperty, fromCSSValueToText} from '../helpers/css.js';

class CSSGetValueCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(what's|what is|get)( its)? (\w+( \w+)?)/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.getComputedValue(toCSSProperty(matches[3]), this._commandRunner.getContextNodeId());
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  getComputedValue(property, nodeId) {
    console.log('getComputedValue', property, nodeId);

    if(!nodeId) {
      throw new Error('Invalid node.');
    }

    let tabDebugger = this._commandRunner.getTabDebugger();

    return tabDebugger.sendCommand('CSS.getComputedStyleForNode', {
      nodeId
    }).then((data) => {
      let item = data.computedStyle.find((item) => {
        return item.name === property;
      });

      if(item) {
        console.log('Property found! Value: ' + fromCSSValueToText(item.value));
        chrome.tts.speak(fromCSSValueToText(item.value));
      } else {
        console.log('Property ' + property + ' not found.');
      }
    }).catch(() => {
      chrome.tts.speak('Node not found.');
      throw new Error('Node not found.');
    });
  }
}

CSSGetValueCommand.description = `Get CSS property value of currently inspected node by saying "get its x" or "what's its x" (where "x" is the name of the CSS property).`;

export default CSSGetValueCommand;