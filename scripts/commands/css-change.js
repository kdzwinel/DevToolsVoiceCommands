import Command from '../command.js';
import {toCSSProperty, toCSSValue} from '../helpers/css.js';

class CSSChangeCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(change|set) (its )?(\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
  }

  execute(text, tabDebugger, commandContext) {
    let matches = text.match(this._regex);

    if(matches) {
      let property = toCSSProperty(matches[3]);
      let value = toCSSValue(matches[5], matches[6]);

      if(matches[3] === 'it') {
        property = commandContext.getContextCSSPropertyName();
      }

      commandContext.setContextCSSPropertyName(property);

      let css = ';' + property + ': ' + value + ';';
      return this.appendToStyles(commandContext.getContextNodeId(), css, tabDebugger);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  appendToStyles(nodeId, text, tabDebugger) {
    console.log('change styles', nodeId, text);

    if(!nodeId) {
      throw new Error('Invalid node.');
    }

    return tabDebugger.sendCommand('DOM.getAttributes', {
      nodeId
    }).then((data) => {
      let oldStyleValue = '';

      if(data.attributes && data.attributes.indexOf('style') !== -1) {
        let idxOfStyle = data.attributes.indexOf('style');
        oldStyleValue = data.attributes[idxOfStyle + 1];
      }

      return tabDebugger.sendCommand('DOM.setAttributeValue', {
        nodeId,
        name: 'style',
        value: oldStyleValue + text
      });
    }).catch(() => {
      chrome.tts.speak('Node not found.');
      throw new Error('Node not found.');
    });
  }
}

CSSChangeCommand.description = `Change CSS property value of currently inspected node by saying "change its x to y" or "set its x to y" (where "x" is the name of the CSS property and "y" is the new value).`;

export default CSSChangeCommand;