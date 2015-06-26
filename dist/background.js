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
          console.log('changing styles from', oldStyleValue);
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
        console.log('getComputedValue', nodeId);
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
          console.log('Node found.');
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
        console.log('undo');
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.redo');
      }
    }, {}, $__super);
  }(Command);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtY2hhbmdlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3JlZG8uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2hlbHBlcnMvdGFicy5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLDhCQUFvQixDQUFDO0lDQTlCLGNBQVksRUFBbEIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGNBQVksQ0FDSixBQUFELENBQUc7QUFDWixTQUFHLGFBQWEsRUFBSSxLQUFHLENBQUM7QUFDeEIsU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLFVBQVUsRUFBSSxJQUFJLElBQUUsQUFBQyxFQUFDLENBQUM7SUFDNUI7QUFrRUYsQUF0RVUsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQU01QyxtQkFBYSxDQUFiLFVBQWUsV0FBVTs7QUFDdkIsV0FBRyxhQUFhLEVBQUksWUFBVSxDQUFDO0FBRS9CLGtCQUFVLFlBQVksQUFBQyxDQUFDLFlBQVcsQ0FBQyxLQUM5QixBQUFDLENBQUMsV0FBVSxZQUFZLEtBQUssQUFBQyxDQUFDLFdBQVUsQ0FBRyxh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QztBQUV6QyxzQkFBZ0IsU0FBUyxZQUFZLEFBQUMsQ0FBQyxTQUFDLFVBQVMsQ0FBTTtBQUNyRCxvQkFBWSxVQUFVLEFBQUMsQ0FBQyxVQUFTLENBQUMsQ0FBQztNQUNyQyxDQUFDLENBQUM7QUFDRixzQkFBZ0IsTUFBTSxZQUFZLEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUN4QyxrQkFBVSxXQUFXLEFBQUMsRUFBQyxDQUFDO0FBQ3hCLHdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNyQixDQUFDLENBQUM7SUFDSixDQUFDLE1BQU0sQUFBQyxDQUFDLFNBQUMsS0FBSSxDQUFNO0FBQ2xCLFNBQUksS0FBSSxHQUFLLGNBQVksQ0FBRztBQUMxQixhQUFLLFFBQVEsZ0JBQWdCLEFBQUMsRUFBQyxDQUFDO01BQ2xDO0FBQUEsQUFFQSxTQUFHLGlCQUFnQixTQUFTLEFBQUMsRUFBQyxDQUFHO0FBQy9CLHdCQUFnQixLQUFLLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxTQUFHLFdBQVUsWUFBWSxBQUFDLEVBQUMsQ0FBRztBQUM1QixrQkFBVSxXQUFXLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxZQUFNLElBQUksQUFBQyxDQUFDLEtBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQztFQUNOLENBQUMsQ0FBQztBQTVFRixXQUF1QiIsImZpbGUiOiIvVXNlcnMva2R6d2luZWwvUHJvamVjdHMvT1MvRGV2VG9vbHNWb2ljZUNvbW1hbmRzL3RlbXBvdXRNQzR5TWpNek9EQXhNRGsxTWpnd056azJNd3JlZHJlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kcyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIHNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSB0YWJEZWJ1Z2dlcjtcblxuICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZW5hYmxlJylcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdDU1MuZW5hYmxlJykpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnRE9NLmdldERvY3VtZW50JykpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBpZighZGF0YS5yb290KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb2N1bWVudCByb290IG5vdCBhdmFpbGFibGUuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yb290Tm9kZUlkID0gZGF0YS5yb290Lm5vZGVJZDtcbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0VGFiRGVidWdnZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhYkRlYnVnZ2VyO1xuICB9XG5cbiAgZ2V0Q29udGV4dE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dE5vZGVJZDtcbiAgfVxuXG4gIHNldENvbnRleHROb2RlSWQoaWQpIHtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gaWQ7XG4gIH1cblxuICBnZXRSb290Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9yb290Tm9kZUlkO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kKGNvbW1hbmRUeXBlKSB7XG4gICAgdGhpcy5fY29tbWFuZHMuYWRkKG5ldyBjb21tYW5kVHlwZSh0aGlzKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBtYXRjaGVzXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb247XG4gICAgICB9KVxuICAgICAgLy9jYWxsIG5leHQgY29tbWFuZCBvbmx5IGFmdGVyIHByZXZpb3VzIG9uZSBoYXMgZmluaXNoZWRcbiAgICAgIC5yZWR1Y2UoKHByb21pc2UsIHtjb21tYW5kfSkgPT4ge1xuICAgICAgICBpZighcHJvbWlzZSkge1xuICAgICAgICAgIHJldHVybiBjb21tYW5kLmV4ZWN1dGUodGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKGNvbW1hbmQuZXhlY3V0ZS5iaW5kKGNvbW1hbmQsIHRleHQpKTtcbiAgICAgIH0sIG51bGwpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHRoaXMuX3JlZ2V4ID0gL14kL2k7XG4gICAgdGhpcy5fY29tbWFuZFJ1bm5lciA9IGNvbW1hbmRSdW5uZXI7XG4gIH1cblxuICBtYXRjaCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQuc2VhcmNoKHRoaXMuX3JlZ2V4KTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwge3RhYkRlYnVnZ2VyLCByb290Tm9kZUlkLCBjb250ZXh0Tm9kZUlkfSkge1xuXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gdG9DU1NQcm9wZXJ0eSh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJyk7XG59XG5cbmxldCBjc3NVbml0cyA9IHtcbiAgcGl4ZWw6ICdweCcsXG4gIHBpeGVsczogJ3B4JyxcbiAgZW06ICdlbScsXG4gIGVtczogJ2VtJyxcbiAgcGVyY2VudDogJyUnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdG9DU1NWYWx1ZSh2YWx1ZSwgdW5pdCkge1xuICBpZiAodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNTU1ZhbHVlVG9UZXh0KGNzc1ZhbHVlKSB7XG4gIGxldCBtYXRjaGVzID0gY3NzVmFsdWUubWF0Y2goLyhbMC05Ll0rKXB4L2kpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgbGV0IG51bVZhbHVlID0gbWF0Y2hlc1sxXTtcblxuICAgIHJldHVybiAobnVtVmFsdWUgPT09IDEpID8gJ29uZSBwaXhlbCcgOiBudW1WYWx1ZSArICcgcGl4ZWxzJztcbiAgfVxuXG4gIHJldHVybiBjc3NWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIHRvQ1NTVmFsdWV9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTQ2hhbmdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGNoYW5nZXxzZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBjc3MgPSAnOycgKyB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pICsgJzogJyArIHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSkgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSwgY3NzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGFuZ2Ugc3R5bGVzJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnY2hhbmdpbmcgc3R5bGVzIGZyb20nLCBvbGRTdHlsZVZhbHVlKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgZnJvbUNTU1ZhbHVlVG9UZXh0fSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0dldFZhbHVlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHdoYXQnc3x3aGF0IGlzfGdldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcHV0ZWRWYWx1ZSh0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pLCB0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBub2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZ2V0Q29tcHV0ZWRWYWx1ZScsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgZm91bmQhIFZhbHVlOiAnICsgZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhayhmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLicpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUodGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlTm9kZShub2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZygncmVtb3ZlTm9kZScsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVEZWxldGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHNlbGVjdHxpbnNwZWN0KSAoXFx3KykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWxlY3ROb2RlKG1hdGNoZXNbMl0gKyAnLCAjJyArIG1hdGNoZXNbMl0gKyAnLCAuJyArIG1hdGNoZXNbMl0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0Tm9kZShzZWxlY3Rvcikge1xuICAgIGNvbnNvbGUubG9nKCdzZWxlY3ROb2RlJywgc2VsZWN0b3IpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuICAgIGxldCByb290Tm9kZUlkID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRSb290Tm9kZUlkKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5xdWVyeVNlbGVjdG9yJywge1xuICAgICAgbm9kZUlkOiByb290Tm9kZUlkLFxuICAgICAgc2VsZWN0b3JcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBpZighZGF0YS5ub2RlSWQpIHtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnTm9kZSBmb3VuZC4nKTtcblxuICAgICAgdGhpcy5fY29tbWFuZFJ1bm5lci5zZXRDb250ZXh0Tm9kZUlkKGRhdGEubm9kZUlkKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiB7XG4gICAgICAgICAgICByOiAxNTUsXG4gICAgICAgICAgICBnOiAxMSxcbiAgICAgICAgICAgIGI6IDIzOSxcbiAgICAgICAgICAgIGE6IDAuN1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIDIwMDApO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVkb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3VuZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlZG8nKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5kb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3VuZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnVuZG8nKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNsYXNzIExpc3RlbmVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgbm90aWZ5TGlzdGVuZXJzKGRhdGEpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdGVuZXJNYW5hZ2VyOyIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcbmNvbnN0IEFDVElWRSA9IDE7XG5jb25zdCBJTkFDVElWRSA9IDI7XG5cbmNsYXNzIFNwZWVjaFJlY29nbml0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuXG4gICAgdGhpcy5vblJlc3VsdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgICB0aGlzLm9uRW5kID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmVjb2duaXRpb24uY29udGludW91cyA9IHRydWU7XG4gICAgLy9yZWNvZ25pdGlvbi5pbnRlcmltUmVzdWx0cyA9IHRydWU7XG5cbiAgICByZWNvZ25pdGlvbi5vbmVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24ub25yZXN1bHQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBpbnRlcmltX3RyYW5zY3JpcHQgPSAnJywgZmluYWxfdHJhbnNjcmlwdCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gZXZlbnQucmVzdWx0SW5kZXg7IGkgPCBldmVudC5yZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChldmVudC5yZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICBmaW5hbF90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnRlcmltX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdTcGVlY2hSZWNvZ25pdGlvbicsIGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgICAgdGhpcy5vblJlc3VsdC5ub3RpZnlMaXN0ZW5lcnMoZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IHJlY29nbml0aW9uO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IEFDVElWRTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoZXZlbnQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IEFDVElWRTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29nbml0aW9uKSB7XG4gICAgICB0aGlzLl9yZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFJlY29nbml0aW9uO1xuIiwiZnVuY3Rpb24gX2F0dGFjaCh0YWJJZCkge1xuICB2YXIgcHJvdG9jb2xWZXJzaW9uID0gJzEuMSc7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuYXR0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIHByb3RvY29sVmVyc2lvbiwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9kZXRhY2godGFiSWQpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuZGV0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfc2VuZENvbW1hbmQodGFiSWQsIGNvbW1hbmQsIGRhdGEgPSB7fSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5zZW5kQ29tbWFuZCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBjb21tYW5kLCBkYXRhLCAocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICByZWplY3QocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY2xhc3MgVGFiRGVidWdnZXIge1xuICBjb25zdHJ1Y3Rvcih0YWJJZCkge1xuICAgIHRoaXMuX3RhYklkID0gdGFiSWQ7XG4gICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuXG4gICAgY2hyb21lLmRlYnVnZ2VyLm9uRGV0YWNoLmFkZExpc3RlbmVyKChzb3VyY2UsIHJlYXNvbikgPT4ge1xuICAgICAgaWYoc291cmNlLnRhYklkID09PSB0aGlzLl90YWJJZCkge1xuICAgICAgICB0aGlzLl9hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICByZXR1cm4gX2F0dGFjaCh0aGlzLl90YWJJZCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0KCl7XG4gICAgcmV0dXJuIF9kZXRhY2godGhpcy5fdGFiSWQpO1xuICB9XG5cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoY29tbWFuZCwgZGF0YSkge1xuICAgIGlmKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhYkRlYnVnZ2VyOyIsImltcG9ydCBTcGVlY2hSZWNvZ25pdGlvbiBmcm9tICcuL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyc7XG5pbXBvcnQgQ29tbWFuZFJ1bm5lciBmcm9tICcuL2NvbW1hbmQtcnVubmVyLmpzJztcbmltcG9ydCBUYWJEZWJ1Z2dlciBmcm9tICcuL3RhYi1kZWJ1Z2dlci5qcyc7XG5pbXBvcnQge2dldEFjdGl2ZVRhYn0gZnJvbSAnLi9oZWxwZXJzL3RhYnMuanMnO1xuXG5pbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzJztcbmltcG9ydCBOb2RlRGVsZXRpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1kZWxldGlvbi5qcyc7XG5pbXBvcnQgQ1NTQ2hhbmdlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IENTU0dldFZhbHVlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMnO1xuaW1wb3J0IFVuZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvdW5kby5qcyc7XG5pbXBvcnQgUmVkb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9yZWRvLmpzJztcblxuZnVuY3Rpb24gc2hvd1JlY29yZGluZ0ljb24oKSB7XG4gIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgdGV4dDogJ8K3J1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaGlkZVJlY29yZGluZ0ljb24oKSB7XG4gIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgdGV4dDonJ1xuICB9KTtcbn1cblxubGV0IHNwZWVjaFJlY29nbml0aW9uID0gbmV3IFNwZWVjaFJlY29nbml0aW9uKCk7XG5sZXQgY29tbWFuZFJ1bm5lciA9IG5ldyBDb21tYW5kUnVubmVyKCk7XG5cbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVJbnNwZWN0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlRGVsZXRpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0NoYW5nZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTR2V0VmFsdWVDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFVuZG9Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFJlZG9Db21tYW5kKTtcblxuY2hyb21lLmJyb3dzZXJBY3Rpb24ub25DbGlja2VkLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgaWYoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgdGFiRGVidWdnZXI7XG5cbiAgc3BlZWNoUmVjb2duaXRpb25cbiAgICAuc3RhcnQoKVxuICAgIC50aGVuKGdldEFjdGl2ZVRhYilcbiAgICAudGhlbigodGFiKSA9PiB7XG4gICAgICB0YWJEZWJ1Z2dlciA9IG5ldyBUYWJEZWJ1Z2dlcih0YWIuaWQpO1xuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLmNvbm5lY3QoKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHNob3dSZWNvcmRpbmdJY29uKCk7XG5cbiAgICAgIGNvbW1hbmRSdW5uZXIuc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpO1xuXG4gICAgICBzcGVlY2hSZWNvZ25pdGlvbi5vblJlc3VsdC5hZGRMaXN0ZW5lcigodHJhbnNjcmlwdCkgPT4ge1xuICAgICAgICBjb21tYW5kUnVubmVyLnJlY29nbml6ZSh0cmFuc2NyaXB0KTtcbiAgICAgIH0pO1xuICAgICAgc3BlZWNoUmVjb2duaXRpb24ub25FbmQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgICB0YWJEZWJ1Z2dlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIGhpZGVSZWNvcmRpbmdJY29uKCk7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciA9PSAnbm90LWFsbG93ZWQnKSB7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9wZW5PcHRpb25zUGFnZSgpO1xuICAgICAgfVxuXG4gICAgICBpZihzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFiRGVidWdnZXIuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgICB0YWJEZWJ1Z2dlci5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn0pOyJdfQ==
