var $__scripts_47_command_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command.js";
  var Command = function() {
    function Command(commandRunner) {
      this._regex = /^$/i;
      this._commandRunner = commandRunner;
    }
    return ($traceurRuntime.createClass)(Command, {
      match: function(text) {
        return text.search(this._regex);
      },
      execute: function(text, $__1) {
        var $__2 = $__1,
            tabDebugger = $__2.tabDebugger,
            rootNodeId = $__2.rootNodeId,
            contextNodeId = $__2.contextNodeId;
      }
    }, {});
  }();
  var $__default = Command;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_helpers_47_css_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/helpers/css.js";
  function toCSSProperty(text) {
    return text.toLowerCase().replace(' ', '-');
  }
  var cssUnits = {
    pixel: 'px',
    pixels: 'px',
    em: 'em',
    ems: 'em',
    percent: '%'
  };
  function toCSSValue(value, unit) {
    if (unit) {
      return value + cssUnits[unit];
    }
    return value;
  }
  function fromCSSValueToText(cssValue) {
    var matches = cssValue.match(/([0-9.]+)px/i);
    if (matches) {
      var numValue = matches[1];
      return (numValue === 1) ? 'one pixel' : numValue + ' pixels';
    }
    return cssValue;
  }
  var $__default = {};
  return {
    get toCSSProperty() {
      return toCSSProperty;
    },
    get toCSSValue() {
      return toCSSValue;
    },
    get fromCSSValueToText() {
      return fromCSSValueToText;
    },
    get default() {
      return $__default;
    }
  };
})();
var $__scripts_47_commands_47_css_45_change_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/css-change.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var $__1 = $__scripts_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      toCSSValue = $__1.toCSSValue;
  var CSSChangeCommand = function($__super) {
    function CSSChangeCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSChangeCommand).call(this, commandRunner);
      this._regex = /(change|set)( its)? (\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
    }
    return ($traceurRuntime.createClass)(CSSChangeCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          var css = ';' + toCSSProperty(matches[3]) + ': ' + toCSSValue(matches[5], matches[6]) + ';';
          return this.appendToStyles(this._commandRunner.getContextNodeId(), css);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      appendToStyles: function(nodeId, text) {
        console.log('change styles', nodeId, text);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.getAttributes', {nodeId: nodeId}).then(function(data) {
          var oldStyleValue = '';
          if (data.attributes && data.attributes.indexOf('style') !== -1) {
            var idxOfStyle = data.attributes.indexOf('style');
            oldStyleValue = data.attributes[idxOfStyle + 1];
          }
          return tabDebugger.sendCommand('DOM.setAttributeValue', {
            nodeId: nodeId,
            name: 'style',
            value: oldStyleValue + text
          });
        }).catch(function() {
          chrome.tts.speak('Node not found.');
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSChangeCommand.description = "Change CSS property value of currently inspected node by saying \"change its x to y\" or \"set its x to y\" (where \"x\" is the name of the CSS property and \"y\" is the new value).";
  var $__default = CSSChangeCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_css_45_get_45_value_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/css-get-value.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var $__1 = $__scripts_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      fromCSSValueToText = $__1.fromCSSValueToText;
  var CSSGetValueCommand = function($__super) {
    function CSSGetValueCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSGetValueCommand).call(this, commandRunner);
      this._regex = /(what's|what is|get)( its)? (\w+( \w+)?)/i;
    }
    return ($traceurRuntime.createClass)(CSSGetValueCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.getComputedValue(toCSSProperty(matches[3]), this._commandRunner.getContextNodeId());
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      getComputedValue: function(property, nodeId) {
        console.log('getComputedValue', property, nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('CSS.getComputedStyleForNode', {nodeId: nodeId}).then(function(data) {
          var item = data.computedStyle.find(function(item) {
            return item.name === property;
          });
          if (item) {
            console.log('Property found! Value: ' + fromCSSValueToText(item.value));
            chrome.tts.speak(fromCSSValueToText(item.value));
          } else {
            console.log('Property ' + property + ' not found.');
          }
        }).catch(function() {
          chrome.tts.speak('Node not found.');
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSGetValueCommand.description = "Get CSS property value of currently inspected node by saying \"get its x\" or \"what's its x\" (where \"x\" is the name of the CSS property).";
  var $__default = CSSGetValueCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_node_45_deletion_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/node-deletion.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var NodeDeletionCommand = function($__super) {
    function NodeDeletionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeDeletionCommand).call(this, commandRunner);
      this._regex = /(delete|remove) it/i;
    }
    return ($traceurRuntime.createClass)(NodeDeletionCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.removeNode(this._commandRunner.getContextNodeId());
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      removeNode: function(nodeId) {
        console.log('removeNode', nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.removeNode', {nodeId: nodeId}).catch(function() {
          chrome.tts.speak('Node not found.');
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  NodeDeletionCommand.description = "Remove currently inspected node with \"remove it\" or \"delete it\".";
  var $__default = NodeDeletionCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_node_45_inspection_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/node-inspection.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var NodeInspectionCommand = function($__super) {
    function NodeInspectionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeInspectionCommand).call(this, commandRunner);
      this._regex = /(select|inspect) (\w+)/i;
    }
    return ($traceurRuntime.createClass)(NodeInspectionCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.selectNode(matches[2] + ', #' + matches[2] + ', .' + matches[2]);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      selectNode: function(selector) {
        var $__1 = this;
        console.log('selectNode', selector);
        var tabDebugger = this._commandRunner.getTabDebugger();
        var rootNodeId = this._commandRunner.getRootNodeId();
        return tabDebugger.sendCommand('DOM.querySelector', {
          nodeId: rootNodeId,
          selector: selector
        }).then(function(data) {
          if (!data.nodeId) {
            chrome.tts.speak('Node not found.');
            throw new Error('Node not found.');
          }
          $__1._commandRunner.setContextNodeId(data.nodeId);
          return tabDebugger.sendCommand('DOM.highlightNode', {
            highlightConfig: {
              contentColor: {
                r: 155,
                g: 11,
                b: 239,
                a: 0.7
              },
              showInfo: true
            },
            nodeId: data.nodeId
          }).then(function() {
            setTimeout(function() {
              tabDebugger.sendCommand('DOM.hideHighlight');
            }, 2000);
          });
        }).catch(function() {
          chrome.tts.speak('Node not found.');
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  NodeInspectionCommand.description = "Select DOM nodes with \"select x\" or \"inspect x\" (where \"x\" is the name of the tag, id or CSS class). If multiple nodes match, only the first one will be selected.";
  var $__default = NodeInspectionCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_redo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/redo.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var RedoCommand = function($__super) {
    function RedoCommand(commandRunner) {
      $traceurRuntime.superConstructor(RedoCommand).call(this, commandRunner);
      this._regex = /redo/i;
    }
    return ($traceurRuntime.createClass)(RedoCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.redoLastAction();
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      redoLastAction: function() {
        console.log('redo');
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.redo');
      }
    }, {}, $__super);
  }(Command);
  RedoCommand.description = "Redo last command with \"redo\".";
  var $__default = RedoCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_undo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/undo.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var UndoCommand = function($__super) {
    function UndoCommand(commandRunner) {
      $traceurRuntime.superConstructor(UndoCommand).call(this, commandRunner);
      this._regex = /undo/i;
    }
    return ($traceurRuntime.createClass)(UndoCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.undoLastAction();
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      undoLastAction: function() {
        console.log('undo');
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.undo');
      }
    }, {}, $__super);
  }(Command);
  UndoCommand.description = "Undo last command with \"undo\".";
  var $__default = UndoCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_options_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/options.js";
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_commands_47_redo_46_js__).default;
  function initSpeechRecognition() {
    var recognition = new webkitSpeechRecognition();
    var errorNode = document.querySelector('.error');
    var loadingScreen = document.querySelector('.loading');
    var askScreen = document.querySelector('.ask');
    var successScreen = document.querySelector('.success');
    recognition.onstart = function() {
      loadingScreen.hidden = true;
      askScreen.hidden = true;
      successScreen.hidden = false;
      recognition.stop();
    };
    recognition.onerror = function(event) {
      errorNode.innerText = "Ups! Something went wrong, we got this error back: " + event.error;
    };
    recognition.start();
    setTimeout(function() {
      if (!loadingScreen.hidden) {
        loadingScreen.hidden = true;
        askScreen.hidden = false;
      }
    }, 300);
  }
  function initListOfVoices() {
    var voiceSelect = document.querySelector('#voice');
    voiceSelect.addEventListener('change', function() {
      var voiceName = voiceSelect.value;
      if (voiceName !== '') {
        localStorage.voiceName = voiceName;
        chrome.tts.speak(voiceName + ' voice selected.', {voiceName: voiceName});
      } else {
        localStorage.voiceName = null;
        chrome.tts.speak('Default voice selected.');
      }
    });
    chrome.tts.getVoices(function(list) {
      list.filter(function(voice) {
        return (voice.lang.substr(0, 3) === 'en-');
      }).forEach(function(voice) {
        var option = document.createElement('option');
        option.innerText = voice.voiceName;
        if (voice.voiceName === localStorage.voiceName) {
          option.selected = true;
        }
        voiceSelect.appendChild(option);
      });
    });
  }
  function initListOfCommands() {
    var commandsList = document.querySelector('#commands');
    [NodeInspectionCommand, NodeDeletionCommand, CSSChangeCommand, CSSGetValueCommand, UndoCommand, RedoCommand].forEach(function(command) {
      var li = document.createElement('li');
      li.innerText = command.description;
      commandsList.appendChild(li);
    });
  }
  initSpeechRecognition();
  initListOfVoices();
  initListOfCommands();
  return {};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvb3B0aW9ucy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLEFBQUksSUFBQSxDQUFBLFlBQVcsdUJBQW9CLENBQUM7SUNBOUIsUUFBTSxFQUFaLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxRQUFNLENBQ0UsYUFBWSxDQUFHO0FBQ3pCLFNBQUcsT0FBTyxFQUFJLE1BQUksQ0FBQztBQUNuQixTQUFHLGVBQWUsRUFBSSxjQUFZLENBQUM7SUFDckM7QUFTRixBQVhVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFJNUMsVUFBSSxDQUFKLFVBQU0sSUFBRyxDQUFHO0FBQ1YsYUFBTyxDQUFBLElBQUcsT0FBTyxBQUFDLENBQUMsSUFBRyxPQUFPLENBQUMsQ0FBQztNQUNqQztBQUVBLFlBQU0sQ0FBTixVQUFRLElBQUcsQ0FBRyxLQUF1Qzs7QUFBdEMsc0JBQVU7QUFBRyxxQkFBUztBQUFHLHdCQUFZO01BRXBEO1NBVDhELENBQUM7RUFDekQsQUFBQyxFQUFDO0FBSlYsQUFBSSxJQUFBLENBQUEsVUFBUyxFQWVFLFFBQU0sQUFmWSxDQUFBO0FBQWpDLFNBQUEsYUFBd0I7QUFBRSx1QkFBd0I7SUFBRSxFQUE3Qjs7OztBQUF2QixBQUFJLElBQUEsQ0FBQSxZQUFXLDJCQUFvQixDQUFDO0FDQTdCLFNBQVMsY0FBWSxDQUFFLElBQUcsQ0FBRztBQUNsQyxTQUFPLENBQUEsSUFB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LENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQztBQUNyQyxPQUFDLFVBQVUsRUFBSSxDQUFBLE9BQU0sWUFBWSxDQUFDO0FBRWxDLGlCQUFXLFlBQVksQUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQztFQUNOO0FBRUEsc0JBQW9CLEFBQUMsRUFBQyxDQUFDO0FBQ3ZCLGlCQUFlLEFBQUMsRUFBQyxDQUFDO0FBQ2xCLG1CQUFpQixBQUFDLEVBQUMsQ0FBQztBQXRGcEIsV0FBdUIiLCJmaWxlIjoiL1VzZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0ME1qZzNPREUzTVRrMk5EVTBPRFV6LmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHRoaXMuX3JlZ2V4ID0gL14kL2k7XG4gICAgdGhpcy5fY29tbWFuZFJ1bm5lciA9IGNvbW1hbmRSdW5uZXI7XG4gIH1cblxuICBtYXRjaCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQuc2VhcmNoKHRoaXMuX3JlZ2V4KTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwge3RhYkRlYnVnZ2VyLCByb290Tm9kZUlkLCBjb250ZXh0Tm9kZUlkfSkge1xuXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gdG9DU1NQcm9wZXJ0eSh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJyk7XG59XG5cbmxldCBjc3NVbml0cyA9IHtcbiAgcGl4ZWw6ICdweCcsXG4gIHBpeGVsczogJ3B4JyxcbiAgZW06ICdlbScsXG4gIGVtczogJ2VtJyxcbiAgcGVyY2VudDogJyUnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdG9DU1NWYWx1ZSh2YWx1ZSwgdW5pdCkge1xuICBpZiAodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNTU1ZhbHVlVG9UZXh0KGNzc1ZhbHVlKSB7XG4gIGxldCBtYXRjaGVzID0gY3NzVmFsdWUubWF0Y2goLyhbMC05Ll0rKXB4L2kpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgbGV0IG51bVZhbHVlID0gbWF0Y2hlc1sxXTtcblxuICAgIHJldHVybiAobnVtVmFsdWUgPT09IDEpID8gJ29uZSBwaXhlbCcgOiBudW1WYWx1ZSArICcgcGl4ZWxzJztcbiAgfVxuXG4gIHJldHVybiBjc3NWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIHRvQ1NTVmFsdWV9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTQ2hhbmdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGNoYW5nZXxzZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBjc3MgPSAnOycgKyB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pICsgJzogJyArIHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSkgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSwgY3NzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGFuZ2Ugc3R5bGVzJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5zZXRBdHRyaWJ1dGVWYWx1ZScsIHtcbiAgICAgICAgbm9kZUlkLFxuICAgICAgICBuYW1lOiAnc3R5bGUnLFxuICAgICAgICB2YWx1ZTogb2xkU3R5bGVWYWx1ZSArIHRleHRcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NDaGFuZ2VDb21tYW5kLmRlc2NyaXB0aW9uID0gYENoYW5nZSBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImNoYW5nZSBpdHMgeCB0byB5XCIgb3IgXCJzZXQgaXRzIHggdG8geVwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IGFuZCBcInlcIiBpcyB0aGUgbmV3IHZhbHVlKS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NDaGFuZ2VDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCBmcm9tQ1NTVmFsdWVUb1RleHR9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTR2V0VmFsdWVDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8od2hhdCdzfHdoYXQgaXN8Z2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDb21wdXRlZFZhbHVlKHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSksIHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIG5vZGVJZCkge1xuICAgIGNvbnNvbGUubG9nKCdnZXRDb21wdXRlZFZhbHVlJywgcHJvcGVydHksIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgZm91bmQhIFZhbHVlOiAnICsgZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhayhmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLicpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NHZXRWYWx1ZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgR2V0IENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiZ2V0IGl0cyB4XCIgb3IgXCJ3aGF0J3MgaXRzIHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVOb2RlKHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ3JlbW92ZU5vZGUnLCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVtb3ZlTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlRGVsZXRpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlbW92ZSBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgd2l0aCBcInJlbW92ZSBpdFwiIG9yIFwiZGVsZXRlIGl0XCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZURlbGV0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZUluc3BlY3Rpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oc2VsZWN0fGluc3BlY3QpIChcXHcrKS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5vZGUobWF0Y2hlc1syXSArICcsICMnICsgbWF0Y2hlc1syXSArICcsIC4nICsgbWF0Y2hlc1syXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3ROb2RlKHNlbGVjdG9yKSB7XG4gICAgY29uc29sZS5sb2coJ3NlbGVjdE5vZGUnLCBzZWxlY3Rvcik7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG4gICAgbGV0IHJvb3ROb2RlSWQgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFJvb3ROb2RlSWQoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnF1ZXJ5U2VsZWN0b3InLCB7XG4gICAgICBub2RlSWQ6IHJvb3ROb2RlSWQsXG4gICAgICBzZWxlY3RvclxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGlmKCFkYXRhLm5vZGVJZCkge1xuICAgICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY29tbWFuZFJ1bm5lci5zZXRDb250ZXh0Tm9kZUlkKGRhdGEubm9kZUlkKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiB7XG4gICAgICAgICAgICByOiAxNTUsXG4gICAgICAgICAgICBnOiAxMSxcbiAgICAgICAgICAgIGI6IDIzOSxcbiAgICAgICAgICAgIGE6IDAuN1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIDIwMDApO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVJbnNwZWN0aW9uQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBTZWxlY3QgRE9NIG5vZGVzIHdpdGggXCJzZWxlY3QgeFwiIG9yIFwiaW5zcGVjdCB4XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSB0YWcsIGlkIG9yIENTUyBjbGFzcykuIElmIG11bHRpcGxlIG5vZGVzIG1hdGNoLCBvbmx5IHRoZSBmaXJzdCBvbmUgd2lsbCBiZSBzZWxlY3RlZC5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFJlZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC9yZWRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVkb0xhc3RBY3Rpb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdyZWRvJyk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5kb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3VuZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnVuZG8nKTtcbiAgfVxufVxuXG5VbmRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBVbmRvIGxhc3QgY29tbWFuZCB3aXRoIFwidW5kb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFVuZG9Db21tYW5kOyIsImltcG9ydCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMnO1xuaW1wb3J0IE5vZGVEZWxldGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWNoYW5nZS5qcyc7XG5pbXBvcnQgQ1NTR2V0VmFsdWVDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWdldC12YWx1ZS5qcyc7XG5pbXBvcnQgVW5kb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3JlZG8uanMnO1xuXG5mdW5jdGlvbiBpbml0U3BlZWNoUmVjb2duaXRpb24oKSB7XG4gIGxldCByZWNvZ25pdGlvbiA9IG5ldyB3ZWJraXRTcGVlY2hSZWNvZ25pdGlvbigpO1xuICBsZXQgZXJyb3JOb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVycm9yJyk7XG4gIGxldCBsb2FkaW5nU2NyZWVuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxvYWRpbmcnKTtcbiAgbGV0IGFza1NjcmVlbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hc2snKTtcbiAgbGV0IHN1Y2Nlc3NTY3JlZW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3VjY2VzcycpO1xuXG4gIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgbG9hZGluZ1NjcmVlbi5oaWRkZW4gPSB0cnVlO1xuICAgIGFza1NjcmVlbi5oaWRkZW4gPSB0cnVlO1xuICAgIHN1Y2Nlc3NTY3JlZW4uaGlkZGVuID0gZmFsc2U7XG5cbiAgICByZWNvZ25pdGlvbi5zdG9wKCk7XG4gIH07XG4gIHJlY29nbml0aW9uLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICBlcnJvck5vZGUuaW5uZXJUZXh0ID0gXCJVcHMhIFNvbWV0aGluZyB3ZW50IHdyb25nLCB3ZSBnb3QgdGhpcyBlcnJvciBiYWNrOiBcIiArIGV2ZW50LmVycm9yO1xuICB9O1xuXG4gIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYoIWxvYWRpbmdTY3JlZW4uaGlkZGVuKSB7XG4gICAgICBsb2FkaW5nU2NyZWVuLmhpZGRlbiA9IHRydWU7XG4gICAgICBhc2tTY3JlZW4uaGlkZGVuID0gZmFsc2U7XG4gICAgfVxuICB9LCAzMDApO1xufVxuXG5mdW5jdGlvbiBpbml0TGlzdE9mVm9pY2VzKCkge1xuICBsZXQgdm9pY2VTZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdm9pY2UnKTtcblxuICB2b2ljZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgbGV0IHZvaWNlTmFtZSA9IHZvaWNlU2VsZWN0LnZhbHVlO1xuXG4gICAgaWYodm9pY2VOYW1lICE9PSAnJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnZvaWNlTmFtZSA9IHZvaWNlTmFtZTtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsodm9pY2VOYW1lICsgJyB2b2ljZSBzZWxlY3RlZC4nLCB7dm9pY2VOYW1lfSlcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnZvaWNlTmFtZSA9IG51bGw7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdEZWZhdWx0IHZvaWNlIHNlbGVjdGVkLicpO1xuICAgIH1cbiAgfSk7XG5cbiAgY2hyb21lLnR0cy5nZXRWb2ljZXMoKGxpc3QpID0+IHtcbiAgICBsaXN0LmZpbHRlcigodm9pY2UpID0+IHtcbiAgICAgIHJldHVybiAodm9pY2UubGFuZy5zdWJzdHIoMCwzKSA9PT0gJ2VuLScpO1xuICAgIH0pLmZvckVhY2goKHZvaWNlKSA9PiB7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24uaW5uZXJUZXh0ID0gdm9pY2Uudm9pY2VOYW1lO1xuXG4gICAgICBpZih2b2ljZS52b2ljZU5hbWUgPT09IGxvY2FsU3RvcmFnZS52b2ljZU5hbWUpIHtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdm9pY2VTZWxlY3QuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRMaXN0T2ZDb21tYW5kcygpIHtcbiAgbGV0IGNvbW1hbmRzTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tYW5kcycpO1xuXG4gIFtcbiAgICBOb2RlSW5zcGVjdGlvbkNvbW1hbmQsXG4gICAgTm9kZURlbGV0aW9uQ29tbWFuZCxcbiAgICBDU1NDaGFuZ2VDb21tYW5kLFxuICAgIENTU0dldFZhbHVlQ29tbWFuZCxcbiAgICBVbmRvQ29tbWFuZCxcbiAgICBSZWRvQ29tbWFuZFxuICBdLmZvckVhY2goKGNvbW1hbmQpID0+IHtcbiAgICAgIGxldCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBsaS5pbm5lclRleHQgPSBjb21tYW5kLmRlc2NyaXB0aW9uO1xuXG4gICAgICBjb21tYW5kc0xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH0pO1xufVxuXG5pbml0U3BlZWNoUmVjb2duaXRpb24oKTtcbmluaXRMaXN0T2ZWb2ljZXMoKTtcbmluaXRMaXN0T2ZDb21tYW5kcygpOyJdfQ==
