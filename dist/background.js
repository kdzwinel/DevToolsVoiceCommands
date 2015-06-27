var $__scripts_47_command_45_runner_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command-runner.js";
  var CommandRunner = function() {
    function CommandRunner() {
      this._tabDebugger = null;
      this._rootNodeId = null;
      this._contextNodeId = null;
      this._commands = new Set();
    }
    return ($traceurRuntime.createClass)(CommandRunner, {
      setTabDebugger: function(tabDebugger) {
        var $__0 = this;
        this._tabDebugger = tabDebugger;
        tabDebugger.sendCommand('DOM.enable').then(tabDebugger.sendCommand.bind(tabDebugger, 'CSS.enable')).then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument')).then(function(data) {
          if (!data.root) {
            throw new Error('Document root not available.');
          }
          $__0._rootNodeId = data.root.nodeId;
        });
      },
      getTabDebugger: function() {
        return this._tabDebugger;
      },
      getContextNodeId: function() {
        return this._contextNodeId;
      },
      setContextNodeId: function(id) {
        this._contextNodeId = id;
      },
      getRootNodeId: function() {
        return this._rootNodeId;
      },
      registerCommand: function(commandType) {
        this._commands.add(new commandType(this));
      },
      recognize: function(text) {
        var matches = [];
        this._commands.forEach(function(command) {
          var position = command.match(text);
          if (position !== -1) {
            matches.push({
              position: position,
              command: command
            });
          }
        });
        return matches.sort(function(a, b) {
          return a.position - b.position;
        }).reduce(function(promise, $__2) {
          var command = $__2.command;
          if (!promise) {
            return command.execute(text);
          }
          return promise.then(command.execute.bind(command, text));
        }, null);
      }
    }, {});
  }();
  var $__default = CommandRunner;
  return {get default() {
      return $__default;
    }};
})();
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
var $__scripts_47_helpers_47_tabs_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/helpers/tabs.js";
  function getActiveTab() {
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({active: true}, function(tabs) {
        if (tabs.length === 0) {
          reject();
          return;
        }
        resolve(tabs[0]);
      });
    });
  }
  var $__default = {};
  return {
    get getActiveTab() {
      return getActiveTab;
    },
    get default() {
      return $__default;
    }
  };
})();
var $__scripts_47_listener_45_manager_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/listener-manager.js";
  var ListenerManager = function() {
    function ListenerManager() {
      this.listeners = new Set();
    }
    return ($traceurRuntime.createClass)(ListenerManager, {
      addListener: function(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Listener must be a function.');
        }
        this.listeners.add(listener);
      },
      removeListener: function(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Listener must be a function.');
        }
        this.listeners.delete(listener);
      },
      notifyListeners: function(data) {
        this.listeners.forEach(function(listener) {
          listener(data);
        });
      }
    }, {});
  }();
  var $__default = ListenerManager;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_speech_45_recognition_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/speech-recognition.js";
  var ListenerManager = ($__scripts_47_listener_45_manager_46_js__).default;
  var ACTIVE = 1;
  var INACTIVE = 2;
  var SpeechRecognition = function() {
    function SpeechRecognition() {
      this._recognition = null;
      this._status = INACTIVE;
      this.onResult = new ListenerManager();
      this.onEnd = new ListenerManager();
    }
    return ($traceurRuntime.createClass)(SpeechRecognition, {
      start: function() {
        var $__1 = this;
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.onend = function() {
          $__1._status = INACTIVE;
          $__1.onEnd.notifyListeners();
        };
        recognition.onresult = function(event) {
          var interim_transcript = '',
              final_transcript = '';
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final_transcript += event.results[i][0].transcript;
            } else {
              interim_transcript += event.results[i][0].transcript;
            }
          }
          console.log('SpeechRecognition', final_transcript);
          $__1.onResult.notifyListeners(final_transcript);
        };
        recognition.start();
        this._recognition = recognition;
        return new Promise(function(resolve, reject) {
          recognition.onstart = function() {
            $__1._status = ACTIVE;
            resolve();
          };
          recognition.onerror = function(event) {
            $__1._status = INACTIVE;
            $__1.onEnd.notifyListeners(event.error);
            reject(event.error);
          };
        });
      },
      isActive: function() {
        return this._status === ACTIVE;
      },
      stop: function() {
        if (this._recognition) {
          this._recognition.stop();
        }
      }
    }, {});
  }();
  var $__default = SpeechRecognition;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_tab_45_debugger_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/tab-debugger.js";
  function _attach(tabId) {
    var protocolVersion = '1.1';
    return new Promise(function(resolve, reject) {
      chrome.debugger.attach({tabId: tabId}, protocolVersion, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve();
      });
    });
  }
  function _detach(tabId) {
    return new Promise(function(resolve, reject) {
      chrome.debugger.detach({tabId: tabId}, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve();
      });
    });
  }
  function _sendCommand(tabId, command) {
    var data = arguments[2] !== (void 0) ? arguments[2] : {};
    return new Promise(function(resolve, reject) {
      chrome.debugger.sendCommand({tabId: tabId}, command, data, function(response) {
        if (response.error) {
          reject(response.error);
          return;
        }
        resolve(response);
      });
    });
  }
  var TabDebugger = function() {
    function TabDebugger(tabId) {
      var $__0 = this;
      this._tabId = tabId;
      this._attached = true;
      chrome.debugger.onDetach.addListener(function(source, reason) {
        if (source.tabId === $__0._tabId) {
          $__0._attached = false;
        }
      });
    }
    return ($traceurRuntime.createClass)(TabDebugger, {
      connect: function() {
        var $__0 = this;
        return _attach(this._tabId).then(function() {
          $__0._attached = true;
        });
      },
      disconnect: function() {
        return _detach(this._tabId);
      },
      isConnected: function() {
        return this._attached;
      },
      sendCommand: function(command, data) {
        var $__0 = this;
        if (!this._attached) {
          return this.connect().then(function() {
            return _sendCommand($__0._tabId, command, data);
          });
        }
        return _sendCommand(this._tabId, command, data);
      }
    }, {});
  }();
  var $__default = TabDebugger;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_background_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/background.js";
  var SpeechRecognition = ($__scripts_47_speech_45_recognition_46_js__).default;
  var CommandRunner = ($__scripts_47_command_45_runner_46_js__).default;
  var TabDebugger = ($__scripts_47_tab_45_debugger_46_js__).default;
  var getActiveTab = ($__scripts_47_helpers_47_tabs_46_js__).getActiveTab;
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_commands_47_redo_46_js__).default;
  function showRecordingIcon() {
    chrome.browserAction.setBadgeText({text: '·'});
  }
  function hideRecordingIcon() {
    chrome.browserAction.setBadgeText({text: ''});
  }
  var speechRecognition = new SpeechRecognition();
  var commandRunner = new CommandRunner();
  commandRunner.registerCommand(NodeInspectionCommand);
  commandRunner.registerCommand(NodeDeletionCommand);
  commandRunner.registerCommand(CSSChangeCommand);
  commandRunner.registerCommand(CSSGetValueCommand);
  commandRunner.registerCommand(UndoCommand);
  commandRunner.registerCommand(RedoCommand);
  chrome.browserAction.onClicked.addListener(function() {
    if (speechRecognition.isActive()) {
      speechRecognition.stop();
      return;
    }
    var tabDebugger;
    speechRecognition.start().then(getActiveTab).then(function(tab) {
      tabDebugger = new TabDebugger(tab.id);
      return tabDebugger.connect();
    }).then(function() {
      showRecordingIcon();
      commandRunner.setTabDebugger(tabDebugger);
      speechRecognition.onResult.addListener(function(transcript) {
        commandRunner.recognize(transcript);
      });
      speechRecognition.onEnd.addListener(function() {
        tabDebugger.disconnect();
        hideRecordingIcon();
      });
    }).catch(function(error) {
      if (error == 'not-allowed') {
        chrome.runtime.openOptionsPage();
      }
      if (speechRecognition.isActive()) {
        speechRecognition.stop();
      }
      if (tabDebugger.isConnected()) {
        tabDebugger.disconnect();
      }
      console.log(error);
    });
  });
  return {};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtY2hhbmdlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3JlZG8uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2hlbHBlcnMvdGFicy5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLDhCQUFvQixDQUFDO0lDQTlCLGNBQVksRUFBbEIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGNBQVksQ0FDSixBQUFELENBQUc7QUFDWixTQUFHLGFBQWEsRUFBSSxLQUFHLENBQUM7QUFDeEIsU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLFVBQVUsRUFBSSxJQUFJLElBQUUsQUFBQyxFQUFDLENBQUM7SUFDNUI7QUFrRUYsQUF0RVUsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQU01QyxtQkFBYSxDQUFiLFVBQWUsV0FBVTs7QUFDdkIsV0FBRyxhQUFhLEVBQUksWUFBVSxDQUFDO0FBRS9CLGtCQUFVLFlBQVksQUFBQyxDQUFDLFlBQVcsQ0FBQyxLQUM5QixBQUFDLENBQUMsV0FBVSxZQUFZLEtBQUssQUFBQyxDQUFDLFdBQVUsQ0FBRyxh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QUEsV0FBVSxRQUFRLEFBQUMsRUFBQyxDQUFDO0lBQzlCLENBQUMsS0FDRyxBQUFDLENBQUMsU0FBQyxBQUFEO0FBQ0osc0JBQWdCLEFBQUMsRUFBQyxDQUFDO0FBRW5CLGtCQUFZLGVBQWUsQUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFDO0FBRXpDLHNCQUFnQixTQUFTLFlBQVksQUFBQyxDQUFDLFNBQUMsVUFBUyxDQUFNO0FBQ3JELG9CQUFZLFVBQVUsQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO01BQ3JDLENBQUMsQ0FBQztBQUNGLHNCQUFnQixNQUFNLFlBQVksQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBQ3hDLGtCQUFVLFdBQVcsQUFBQyxFQUFDLENBQUM7QUFDeEIsd0JBQWdCLEFBQUMsRUFBQyxDQUFDO01BQ3JCLENBQUMsQ0FBQztJQUNKLENBQUMsTUFBTSxBQUFDLENBQUMsU0FBQyxLQUFJLENBQU07QUFDbEIsU0FBSSxLQUFJLEdBQUssY0FBWSxDQUFHO0FBQzFCLGFBQUssUUFBUSxnQkFBZ0IsQUFBQyxFQUFDLENBQUM7TUFDbEM7QUFBQSxBQUVBLFNBQUcsaUJBQWdCLFNBQVMsQUFBQyxFQUFDLENBQUc7QUFDL0Isd0JBQWdCLEtBQUssQUFBQyxFQUFDLENBQUM7TUFDMUI7QUFBQSxBQUVBLFNBQUcsV0FBVSxZQUFZLEFBQUMsRUFBQyxDQUFHO0FBQzVCLGtCQUFVLFdBQVcsQUFBQyxFQUFDLENBQUM7TUFDMUI7QUFBQSxBQUVBLFlBQU0sSUFBSSxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0FBNUVGLFdBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9rZHp3aW5lbC9Qcm9qZWN0cy9PUy9EZXZUb29sc1ZvaWNlQ29tbWFuZHMvdGVtcG91dE1DNDFNVEUyTVRZd05EUTBORFE1TmpNei5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kcyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIHNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSB0YWJEZWJ1Z2dlcjtcblxuICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZW5hYmxlJylcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdDU1MuZW5hYmxlJykpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnRE9NLmdldERvY3VtZW50JykpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBpZighZGF0YS5yb290KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb2N1bWVudCByb290IG5vdCBhdmFpbGFibGUuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yb290Tm9kZUlkID0gZGF0YS5yb290Lm5vZGVJZDtcbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0VGFiRGVidWdnZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhYkRlYnVnZ2VyO1xuICB9XG5cbiAgZ2V0Q29udGV4dE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dE5vZGVJZDtcbiAgfVxuXG4gIHNldENvbnRleHROb2RlSWQoaWQpIHtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gaWQ7XG4gIH1cblxuICBnZXRSb290Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9yb290Tm9kZUlkO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kKGNvbW1hbmRUeXBlKSB7XG4gICAgdGhpcy5fY29tbWFuZHMuYWRkKG5ldyBjb21tYW5kVHlwZSh0aGlzKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBtYXRjaGVzXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb247XG4gICAgICB9KVxuICAgICAgLy9jYWxsIG5leHQgY29tbWFuZCBvbmx5IGFmdGVyIHByZXZpb3VzIG9uZSBoYXMgZmluaXNoZWRcbiAgICAgIC5yZWR1Y2UoKHByb21pc2UsIHtjb21tYW5kfSkgPT4ge1xuICAgICAgICBpZighcHJvbWlzZSkge1xuICAgICAgICAgIHJldHVybiBjb21tYW5kLmV4ZWN1dGUodGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKGNvbW1hbmQuZXhlY3V0ZS5iaW5kKGNvbW1hbmQsIHRleHQpKTtcbiAgICAgIH0sIG51bGwpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHRoaXMuX3JlZ2V4ID0gL14kL2k7XG4gICAgdGhpcy5fY29tbWFuZFJ1bm5lciA9IGNvbW1hbmRSdW5uZXI7XG4gIH1cblxuICBtYXRjaCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQuc2VhcmNoKHRoaXMuX3JlZ2V4KTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwge3RhYkRlYnVnZ2VyLCByb290Tm9kZUlkLCBjb250ZXh0Tm9kZUlkfSkge1xuXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gdG9DU1NQcm9wZXJ0eSh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJyk7XG59XG5cbmxldCBjc3NVbml0cyA9IHtcbiAgcGl4ZWw6ICdweCcsXG4gIHBpeGVsczogJ3B4JyxcbiAgZW06ICdlbScsXG4gIGVtczogJ2VtJyxcbiAgcGVyY2VudDogJyUnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdG9DU1NWYWx1ZSh2YWx1ZSwgdW5pdCkge1xuICBpZiAodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNTU1ZhbHVlVG9UZXh0KGNzc1ZhbHVlKSB7XG4gIGxldCBtYXRjaGVzID0gY3NzVmFsdWUubWF0Y2goLyhbMC05Ll0rKXB4L2kpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgbGV0IG51bVZhbHVlID0gbWF0Y2hlc1sxXTtcblxuICAgIHJldHVybiAobnVtVmFsdWUgPT09IDEpID8gJ29uZSBwaXhlbCcgOiBudW1WYWx1ZSArICcgcGl4ZWxzJztcbiAgfVxuXG4gIHJldHVybiBjc3NWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIHRvQ1NTVmFsdWV9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTQ2hhbmdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGNoYW5nZXxzZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBjc3MgPSAnOycgKyB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pICsgJzogJyArIHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSkgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSwgY3NzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGFuZ2Ugc3R5bGVzJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5zZXRBdHRyaWJ1dGVWYWx1ZScsIHtcbiAgICAgICAgbm9kZUlkLFxuICAgICAgICBuYW1lOiAnc3R5bGUnLFxuICAgICAgICB2YWx1ZTogb2xkU3R5bGVWYWx1ZSArIHRleHRcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NDaGFuZ2VDb21tYW5kLmRlc2NyaXB0aW9uID0gYENoYW5nZSBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImNoYW5nZSBpdHMgeCB0byB5XCIgb3IgXCJzZXQgaXRzIHggdG8geVwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IGFuZCBcInlcIiBpcyB0aGUgbmV3IHZhbHVlKS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NDaGFuZ2VDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCBmcm9tQ1NTVmFsdWVUb1RleHR9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTR2V0VmFsdWVDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8od2hhdCdzfHdoYXQgaXN8Z2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDb21wdXRlZFZhbHVlKHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSksIHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIG5vZGVJZCkge1xuICAgIGNvbnNvbGUubG9nKCdnZXRDb21wdXRlZFZhbHVlJywgcHJvcGVydHksIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgZm91bmQhIFZhbHVlOiAnICsgZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhayhmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLicpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NHZXRWYWx1ZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgR2V0IENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiZ2V0IGl0cyB4XCIgb3IgXCJ3aGF0J3MgaXRzIHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVOb2RlKHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ3JlbW92ZU5vZGUnLCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVtb3ZlTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlRGVsZXRpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlbW92ZSBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgd2l0aCBcInJlbW92ZSBpdFwiIG9yIFwiZGVsZXRlIGl0XCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZURlbGV0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZUluc3BlY3Rpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oc2VsZWN0fGluc3BlY3QpIChcXHcrKS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5vZGUobWF0Y2hlc1syXSArICcsICMnICsgbWF0Y2hlc1syXSArICcsIC4nICsgbWF0Y2hlc1syXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3ROb2RlKHNlbGVjdG9yKSB7XG4gICAgY29uc29sZS5sb2coJ3NlbGVjdE5vZGUnLCBzZWxlY3Rvcik7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG4gICAgbGV0IHJvb3ROb2RlSWQgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFJvb3ROb2RlSWQoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnF1ZXJ5U2VsZWN0b3InLCB7XG4gICAgICBub2RlSWQ6IHJvb3ROb2RlSWQsXG4gICAgICBzZWxlY3RvclxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGlmKCFkYXRhLm5vZGVJZCkge1xuICAgICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY29tbWFuZFJ1bm5lci5zZXRDb250ZXh0Tm9kZUlkKGRhdGEubm9kZUlkKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiB7XG4gICAgICAgICAgICByOiAxNTUsXG4gICAgICAgICAgICBnOiAxMSxcbiAgICAgICAgICAgIGI6IDIzOSxcbiAgICAgICAgICAgIGE6IDAuN1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIDIwMDApO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVJbnNwZWN0aW9uQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBTZWxlY3QgRE9NIG5vZGVzIHdpdGggXCJzZWxlY3QgeFwiIG9yIFwiaW5zcGVjdCB4XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSB0YWcsIGlkIG9yIENTUyBjbGFzcykuIElmIG11bHRpcGxlIG5vZGVzIG1hdGNoLCBvbmx5IHRoZSBmaXJzdCBvbmUgd2lsbCBiZSBzZWxlY3RlZC5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFJlZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC9yZWRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVkb0xhc3RBY3Rpb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdyZWRvJyk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5kb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3VuZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnVuZG8nKTtcbiAgfVxufVxuXG5VbmRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBVbmRvIGxhc3QgY29tbWFuZCB3aXRoIFwidW5kb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFVuZG9Db21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVUYWIoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZX0sICh0YWJzKSA9PiB7XG4gICAgICBpZiAodGFicy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSh0YWJzWzBdKTtcbiAgICB9KVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiY2xhc3MgTGlzdGVuZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBub3RpZnlMaXN0ZW5lcnMoZGF0YSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihkYXRhKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0ZW5lck1hbmFnZXI7IiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuY29uc3QgQUNUSVZFID0gMTtcbmNvbnN0IElOQUNUSVZFID0gMjtcblxuY2xhc3MgU3BlZWNoUmVjb2duaXRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG5cbiAgICB0aGlzLm9uUmVzdWx0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICAgIHRoaXMub25FbmQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZWNvZ25pdGlvbi5jb250aW51b3VzID0gdHJ1ZTtcbiAgICAvL3JlY29nbml0aW9uLmludGVyaW1SZXN1bHRzID0gdHJ1ZTtcblxuICAgIHJlY29nbml0aW9uLm9uZW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5vbnJlc3VsdCA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IGludGVyaW1fdHJhbnNjcmlwdCA9ICcnLCBmaW5hbF90cmFuc2NyaXB0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGkgPSBldmVudC5yZXN1bHRJbmRleDsgaSA8IGV2ZW50LnJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGV2ZW50LnJlc3VsdHNbaV0uaXNGaW5hbCkge1xuICAgICAgICAgIGZpbmFsX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludGVyaW1fdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1NwZWVjaFJlY29nbml0aW9uJywgZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgICB0aGlzLm9uUmVzdWx0Lm5vdGlmeUxpc3RlbmVycyhmaW5hbF90cmFuc2NyaXB0KTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICAgIHRoaXMuX3JlY29nbml0aW9uID0gcmVjb2duaXRpb247XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gQUNUSVZFO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycyhldmVudC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gQUNUSVZFO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb2duaXRpb24pIHtcbiAgICAgIHRoaXMuX3JlY29nbml0aW9uLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3BlZWNoUmVjb2duaXRpb247XG4iLCJmdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgIHJlamVjdChyZXNwb25zZS5lcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jbGFzcyBUYWJEZWJ1Z2dlciB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcbiAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG5cbiAgICBjaHJvbWUuZGVidWdnZXIub25EZXRhY2guYWRkTGlzdGVuZXIoKHNvdXJjZSwgcmVhc29uKSA9PiB7XG4gICAgICBpZihzb3VyY2UudGFiSWQgPT09IHRoaXMuX3RhYklkKSB7XG4gICAgICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHJldHVybiBfYXR0YWNoKHRoaXMuX3RhYklkKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKXtcbiAgICByZXR1cm4gX2RldGFjaCh0aGlzLl90YWJJZCk7XG4gIH1cblxuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWQ7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kLCBkYXRhKSB7XG4gICAgaWYoIXRoaXMuX2F0dGFjaGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFiRGVidWdnZXI7IiwiaW1wb3J0IFNwZWVjaFJlY29nbml0aW9uIGZyb20gJy4vc3BlZWNoLXJlY29nbml0aW9uLmpzJztcbmltcG9ydCBDb21tYW5kUnVubmVyIGZyb20gJy4vY29tbWFuZC1ydW5uZXIuanMnO1xuaW1wb3J0IFRhYkRlYnVnZ2VyIGZyb20gJy4vdGFiLWRlYnVnZ2VyLmpzJztcbmltcG9ydCB7Z2V0QWN0aXZlVGFifSBmcm9tICcuL2hlbHBlcnMvdGFicy5qcyc7XG5cbmltcG9ydCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMnO1xuaW1wb3J0IE5vZGVEZWxldGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWNoYW5nZS5qcyc7XG5pbXBvcnQgQ1NTR2V0VmFsdWVDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWdldC12YWx1ZS5qcyc7XG5pbXBvcnQgVW5kb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3JlZG8uanMnO1xuXG5mdW5jdGlvbiBzaG93UmVjb3JkaW5nSWNvbigpIHtcbiAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICB0ZXh0OiAnwrcnXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBoaWRlUmVjb3JkaW5nSWNvbigpIHtcbiAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICB0ZXh0OicnXG4gIH0pO1xufVxuXG5sZXQgc3BlZWNoUmVjb2duaXRpb24gPSBuZXcgU3BlZWNoUmVjb2duaXRpb24oKTtcbmxldCBjb21tYW5kUnVubmVyID0gbmV3IENvbW1hbmRSdW5uZXIoKTtcblxuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZUluc3BlY3Rpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVEZWxldGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTQ2hhbmdlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NHZXRWYWx1ZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5jaHJvbWUuYnJvd3NlckFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBpZihzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCB0YWJEZWJ1Z2dlcjtcblxuICBzcGVlY2hSZWNvZ25pdGlvblxuICAgIC5zdGFydCgpXG4gICAgLnRoZW4oZ2V0QWN0aXZlVGFiKVxuICAgIC50aGVuKCh0YWIpID0+IHtcbiAgICAgIHRhYkRlYnVnZ2VyID0gbmV3IFRhYkRlYnVnZ2VyKHRhYi5pZCk7XG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuY29ubmVjdCgpO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgc2hvd1JlY29yZGluZ0ljb24oKTtcblxuICAgICAgY29tbWFuZFJ1bm5lci5zZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcik7XG5cbiAgICAgIHNwZWVjaFJlY29nbml0aW9uLm9uUmVzdWx0LmFkZExpc3RlbmVyKCh0cmFuc2NyaXB0KSA9PiB7XG4gICAgICAgIGNvbW1hbmRSdW5uZXIucmVjb2duaXplKHRyYW5zY3JpcHQpO1xuICAgICAgfSk7XG4gICAgICBzcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgIHRhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgaGlkZVJlY29yZGluZ0ljb24oKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yID09ICdub3QtYWxsb3dlZCcpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZih0YWJEZWJ1Z2dlci5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICAgIHRhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufSk7Il19
