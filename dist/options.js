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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvb3B0aW9ucy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLEFBQUksSUFBQSxDQUFBLFlBQVcsdUJBQW9CLENBQUM7SUNBOUIsUUFBTSxFQUFaLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxRQUFNLENBQ0UsYUFBWSxDQUFHO0FBQ3pCLFNBQUcsT0FBTyxFQUFJLE1BQUksQ0FBQztBQUNuQixTQUFHLGVBQWUsRUFBSSxjQUFZLENBQUM7SUFDckM7QUFTRixBQVhVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFJNUMsVUFBSSxDQUFKLFVBQU0sSUFBRyxDQUFHO0FBQ1YsYUFBTyxDQUFBLElBQUcsT0FBTyxBQUFDLENBQUMsSUFBRyxPQUFPLENBQUMsQ0FBQztNQUNqQztBQUVBLFlBQU0sQ0FBTixVQUFRLElBQUcsQ0FBRyxLQUF1Qzs7QUFBdEMsc0JBQVU7QUFBRyxxQkFBUztBQUFHLHdCQUFZO01BRXBEO1NBVDhELENBQUM7RUFDekQsQUFBQyxFQUFDO0FBSlYsQUFBSSxJQUFBLENBQUEsVUFBUyxFQWVFLFFBQU0sQUFmWSxDQUFBO0FBQWpDLFNBQUEsYUFBd0I7QUFBRSx1QkFBd0I7SUFBRSxFQUE3Qjs7OztBQUF2QixBQUFJLElBQUEsQ0FBQSxZQUFXLDJCQUFvQixDQUFDO0FDQTdCLFNBQVMsY0FBWSxDQUFFLElBQUcsQ0FBRztBQUNsQyxTQUFPLENBQUEsSUFB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LENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQztBQUNyQyxPQUFDLFVBQVUsRUFBSSxDQUFBLE9BQU0sWUFBWSxDQUFDO0FBRWxDLGlCQUFXLFlBQVksQUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQztFQUNOO0FBRUEsc0JBQW9CLEFBQUMsRUFBQyxDQUFDO0FBQ3ZCLGlCQUFlLEFBQUMsRUFBQyxDQUFDO0FBQ2xCLG1CQUFpQixBQUFDLEVBQUMsQ0FBQztBQXRGcEIsV0FBdUIiLCJmaWxlIjoiL1VzZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0eU1qSTFPVEl4TlRBd09UTTVPRGMxT0FyZWRyZWQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsImNsYXNzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgICB0aGlzLl9jb21tYW5kUnVubmVyID0gY29tbWFuZFJ1bm5lcjtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB7dGFiRGVidWdnZXIsIHJvb3ROb2RlSWQsIGNvbnRleHROb2RlSWR9KSB7XG5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiB0b0NTU1Byb3BlcnR5KHRleHQpIHtcbiAgcmV0dXJuIHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcgJywgJy0nKTtcbn1cblxubGV0IGNzc1VuaXRzID0ge1xuICBwaXhlbDogJ3B4JyxcbiAgcGl4ZWxzOiAncHgnLFxuICBlbTogJ2VtJyxcbiAgZW1zOiAnZW0nLFxuICBwZXJjZW50OiAnJSdcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0NTU1ZhbHVlKHZhbHVlLCB1bml0KSB7XG4gIGlmICh1bml0KSB7XG4gICAgcmV0dXJuIHZhbHVlICsgY3NzVW5pdHNbdW5pdF07XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQ1NTVmFsdWVUb1RleHQoY3NzVmFsdWUpIHtcbiAgbGV0IG1hdGNoZXMgPSBjc3NWYWx1ZS5tYXRjaCgvKFswLTkuXSspcHgvaSk7XG5cbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBsZXQgbnVtVmFsdWUgPSBtYXRjaGVzWzFdO1xuXG4gICAgcmV0dXJuIChudW1WYWx1ZSA9PT0gMSkgPyAnb25lIHBpeGVsJyA6IG51bVZhbHVlICsgJyBwaXhlbHMnO1xuICB9XG5cbiAgcmV0dXJuIGNzc1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgdG9DU1NWYWx1ZX0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NDaGFuZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oY2hhbmdlfHNldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pIHRvIChcXHcrKSA/KHBpeGVsfHBpeGVsc3xwZXJjZW50fGVtfGVtcyk/L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IGNzcyA9ICc7JyArIHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSkgKyAnOiAnICsgdG9DU1NWYWx1ZShtYXRjaGVzWzVdLCBtYXRjaGVzWzZdKSArICc7JztcbiAgICAgIHJldHVybiB0aGlzLmFwcGVuZFRvU3R5bGVzKHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kVG9TdHlsZXMobm9kZUlkLCB0ZXh0KSB7XG4gICAgY29uc29sZS5sb2coJ2NoYW5nZSBzdHlsZXMnLCBub2RlSWQsIHRleHQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZ2V0QXR0cmlidXRlcycsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBvbGRTdHlsZVZhbHVlID0gJyc7XG5cbiAgICAgIGlmKGRhdGEuYXR0cmlidXRlcyAmJiBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKSAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGlkeE9mU3R5bGUgPSBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKTtcbiAgICAgICAgb2xkU3R5bGVWYWx1ZSA9IGRhdGEuYXR0cmlidXRlc1tpZHhPZlN0eWxlICsgMV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnNldEF0dHJpYnV0ZVZhbHVlJywge1xuICAgICAgICBub2RlSWQsXG4gICAgICAgIG5hbWU6ICdzdHlsZScsXG4gICAgICAgIHZhbHVlOiBvbGRTdHlsZVZhbHVlICsgdGV4dFxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0NoYW5nZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgQ2hhbmdlIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiY2hhbmdlIGl0cyB4IHRvIHlcIiBvciBcInNldCBpdHMgeCB0byB5XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkgYW5kIFwieVwiIGlzIHRoZSBuZXcgdmFsdWUpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0NoYW5nZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIGZyb21DU1NWYWx1ZVRvVGV4dH0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NHZXRWYWx1ZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyh3aGF0J3N8d2hhdCBpc3xnZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUodG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKSwgdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ2dldENvbXB1dGVkVmFsdWUnLCBwcm9wZXJ0eSwgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnQ1NTLmdldENvbXB1dGVkU3R5bGVGb3JOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IGl0ZW0gPSBkYXRhLmNvbXB1dGVkU3R5bGUuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5uYW1lID09PSBwcm9wZXJ0eTtcbiAgICAgIH0pO1xuXG4gICAgICBpZihpdGVtKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQcm9wZXJ0eSBmb3VuZCEgVmFsdWU6ICcgKyBmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgICBjaHJvbWUudHRzLnNwZWFrKGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgJyArIHByb3BlcnR5ICsgJyBub3QgZm91bmQuJyk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0dldFZhbHVlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBHZXQgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJnZXQgaXRzIHhcIiBvciBcIndoYXQncyBpdHMgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5KS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUodGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlTm9kZShub2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZygncmVtb3ZlTm9kZScsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdE5vZGUoc2VsZWN0b3IpIHtcbiAgICBjb25zb2xlLmxvZygnc2VsZWN0Tm9kZScsIHNlbGVjdG9yKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcbiAgICBsZXQgcm9vdE5vZGVJZCA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jb21tYW5kUnVubmVyLnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWdobGlnaHROb2RlJywge1xuICAgICAgICBoaWdobGlnaHRDb25maWc6IHtcbiAgICAgICAgICBjb250ZW50Q29sb3I6IHtcbiAgICAgICAgICAgIHI6IDE1NSxcbiAgICAgICAgICAgIGc6IDExLFxuICAgICAgICAgICAgYjogMjM5LFxuICAgICAgICAgICAgYTogMC43XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzaG93SW5mbzogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBub2RlSWQ6IGRhdGEubm9kZUlkXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy9zdG9wIGhpZ2hsaWdodGluZyBhZnRlciBjb3VwbGUgb2Ygc2Vjb25kc1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZGVIaWdobGlnaHQnKTtcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVkb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3JlZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlZG8nKTtcbiAgfVxufVxuXG5SZWRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBSZWRvIGxhc3QgY29tbWFuZCB3aXRoIFwicmVkb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFJlZG9Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBVbmRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvdW5kby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICB1bmRvTGFzdEFjdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygndW5kbycpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00udW5kbycpO1xuICB9XG59XG5cblVuZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFVuZG8gbGFzdCBjb21tYW5kIHdpdGggXCJ1bmRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgVW5kb0NvbW1hbmQ7IiwiaW1wb3J0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMnO1xuaW1wb3J0IENTU0NoYW5nZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtY2hhbmdlLmpzJztcbmltcG9ydCBDU1NHZXRWYWx1ZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3VuZG8uanMnO1xuaW1wb3J0IFJlZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvcmVkby5qcyc7XG5cbmZ1bmN0aW9uIGluaXRTcGVlY2hSZWNvZ25pdGlvbigpIHtcbiAgbGV0IHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gIGxldCBlcnJvck5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZXJyb3InKTtcbiAgbGV0IGxvYWRpbmdTY3JlZW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubG9hZGluZycpO1xuICBsZXQgYXNrU2NyZWVuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFzaycpO1xuICBsZXQgc3VjY2Vzc1NjcmVlbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdWNjZXNzJyk7XG5cbiAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICBsb2FkaW5nU2NyZWVuLmhpZGRlbiA9IHRydWU7XG4gICAgYXNrU2NyZWVuLmhpZGRlbiA9IHRydWU7XG4gICAgc3VjY2Vzc1NjcmVlbi5oaWRkZW4gPSBmYWxzZTtcblxuICAgIHJlY29nbml0aW9uLnN0b3AoKTtcbiAgfTtcbiAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgIGVycm9yTm9kZS5pbm5lclRleHQgPSBcIlVwcyEgU29tZXRoaW5nIHdlbnQgd3JvbmcsIHdlIGdvdCB0aGlzIGVycm9yIGJhY2s6IFwiICsgZXZlbnQuZXJyb3I7XG4gIH07XG5cbiAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZighbG9hZGluZ1NjcmVlbi5oaWRkZW4pIHtcbiAgICAgIGxvYWRpbmdTY3JlZW4uaGlkZGVuID0gdHJ1ZTtcbiAgICAgIGFza1NjcmVlbi5oaWRkZW4gPSBmYWxzZTtcbiAgICB9XG4gIH0sIDMwMCk7XG59XG5cbmZ1bmN0aW9uIGluaXRMaXN0T2ZWb2ljZXMoKSB7XG4gIGxldCB2b2ljZVNlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2b2ljZScpO1xuXG4gIHZvaWNlU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICBsZXQgdm9pY2VOYW1lID0gdm9pY2VTZWxlY3QudmFsdWU7XG5cbiAgICBpZih2b2ljZU5hbWUgIT09ICcnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uudm9pY2VOYW1lID0gdm9pY2VOYW1lO1xuICAgICAgY2hyb21lLnR0cy5zcGVhayh2b2ljZU5hbWUgKyAnIHZvaWNlIHNlbGVjdGVkLicsIHt2b2ljZU5hbWV9KVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uudm9pY2VOYW1lID0gbnVsbDtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ0RlZmF1bHQgdm9pY2Ugc2VsZWN0ZWQuJyk7XG4gICAgfVxuICB9KTtcblxuICBjaHJvbWUudHRzLmdldFZvaWNlcygobGlzdCkgPT4ge1xuICAgIGxpc3QuZmlsdGVyKCh2b2ljZSkgPT4ge1xuICAgICAgcmV0dXJuICh2b2ljZS5sYW5nLnN1YnN0cigwLDMpID09PSAnZW4tJyk7XG4gICAgfSkuZm9yRWFjaCgodm9pY2UpID0+IHtcbiAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgIG9wdGlvbi5pbm5lclRleHQgPSB2b2ljZS52b2ljZU5hbWU7XG5cbiAgICAgIGlmKHZvaWNlLnZvaWNlTmFtZSA9PT0gbG9jYWxTdG9yYWdlLnZvaWNlTmFtZSkge1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2b2ljZVNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdExpc3RPZkNvbW1hbmRzKCkge1xuICBsZXQgY29tbWFuZHNMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1hbmRzJyk7XG5cbiAgW1xuICAgIE5vZGVJbnNwZWN0aW9uQ29tbWFuZCxcbiAgICBOb2RlRGVsZXRpb25Db21tYW5kLFxuICAgIENTU0NoYW5nZUNvbW1hbmQsXG4gICAgQ1NTR2V0VmFsdWVDb21tYW5kLFxuICAgIFVuZG9Db21tYW5kLFxuICAgIFJlZG9Db21tYW5kXG4gIF0uZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGxpLmlubmVyVGV4dCA9IGNvbW1hbmQuZGVzY3JpcHRpb247XG5cbiAgICAgIGNvbW1hbmRzTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfSk7XG59XG5cbmluaXRTcGVlY2hSZWNvZ25pdGlvbigpO1xuaW5pdExpc3RPZlZvaWNlcygpO1xuaW5pdExpc3RPZkNvbW1hbmRzKCk7Il19
