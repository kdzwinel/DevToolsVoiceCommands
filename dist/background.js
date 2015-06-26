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
            }, 3000);
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
  window.cr = commandRunner;
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
      window.td = tabDebugger;
      return tabDebugger.connect();
    }).then(function() {
      showRecordingIcon();
      commandRunner.setTabDebugger(tabDebugger);
      speechRecognition.onResult.addListener(function(transcript) {
        commandRunner.recognize(transcript);
      });
      speechRecognition.onEnd.addListener(function() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtY2hhbmdlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3JlZG8uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2hlbHBlcnMvdGFicy5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLDhCQUFvQixDQUFDO0lDQTlCLGNBQVksRUFBbEIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGNBQVksQ0FDSixBQUFELENBQUc7QUFDWixTQUFHLGFBQWEsRUFBSSxLQUFHLENBQUM7QUFDeEIsU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLFVBQVUsRUFBSSxJQUFJLElBQUUsQUFBQyxFQUFDLENBQUM7SUFDNUI7QUFrRUYsQUF0RVUsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQU01QyxtQkFBYSxDQUFiLFVBQWUsV0FBVTs7QUFDdkIsV0FBRyxhQUFhLEVBQUksWUFBVSxDQUFDO0FBRS9CLGtCQUFVLFlBQVksQUFBQyxDQUFDLFlBQVcsQ0FBQyxLQUM5QixBQUFDLENBQUMsV0FBVSxZQUFZLEtBQUssQUFBQyxDQUFDLFdBQVUsQ0FBRyxh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c0JBQWdCLEFBQUMsRUFBQyxDQUFDO0FBRW5CLGtCQUFZLGVBQWUsQUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFDO0FBRXpDLHNCQUFnQixTQUFTLFlBQVksQUFBQyxDQUFDLFNBQUMsVUFBUyxDQUFNO0FBQ3JELG9CQUFZLFVBQVUsQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO01BQ3JDLENBQUMsQ0FBQztBQUNGLHNCQUFnQixNQUFNLFlBQVksQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBR3hDLHdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNyQixDQUFDLENBQUM7SUFDSixDQUFDLE1BQU0sQUFBQyxDQUFDLFNBQUMsS0FBSSxDQUFNO0FBQ2xCLFNBQUksS0FBSSxHQUFLLGNBQVksQ0FBRztBQUMxQixhQUFLLFFBQVEsZ0JBQWdCLEFBQUMsRUFBQyxDQUFDO01BQ2xDO0FBQUEsQUFFQSxTQUFHLGlCQUFnQixTQUFTLEFBQUMsRUFBQyxDQUFHO0FBQy9CLHdCQUFnQixLQUFLLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxTQUFHLFdBQVUsWUFBWSxBQUFDLEVBQUMsQ0FBRztBQUM1QixrQkFBVSxXQUFXLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxZQUFNLElBQUksQUFBQyxDQUFDLEtBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQztFQUNOLENBQUMsQ0FBQztBQWxGRixXQUF1QiIsImZpbGUiOiIvVXNlcnMva2R6d2luZWwvUHJvamVjdHMvT1MvRGV2VG9vbHNWb2ljZUNvbW1hbmRzL3RlbXBvdXRNQzQzTVRRMk5UVTBNREUwTVRjNU9EVTIuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsImNsYXNzIENvbW1hbmRSdW5uZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IG51bGw7XG4gICAgdGhpcy5fcm9vdE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29tbWFuZHMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBzZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcikge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gdGFiRGVidWdnZXI7XG5cbiAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmVuYWJsZScpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnQ1NTLmVuYWJsZScpKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0RPTS5nZXREb2N1bWVudCcpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYoIWRhdGEucm9vdCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgcm9vdCBub3QgYXZhaWxhYmxlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcm9vdE5vZGVJZCA9IGRhdGEucm9vdC5ub2RlSWQ7XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldFRhYkRlYnVnZ2VyKCkge1xuICAgIHJldHVybiB0aGlzLl90YWJEZWJ1Z2dlcjtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgZ2V0Um9vdE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdE5vZGVJZDtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUodGhpcykpO1xuICB9XG5cbiAgcmVjb2duaXplKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgLy9maWd1cmUgb3V0IHRoZSBvcmRlciBpbiB3aGljaCBjb21tYW5kcyBzaG91bGQgYmUgY2FsbGVkIChtdXN0IGJlIHRoZSBzYW1lIGFzIGluIHRoZSB0ZXh0KVxuICAgIHRoaXMuX2NvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcbiAgICAgIGxldCBwb3NpdGlvbiA9IGNvbW1hbmQubWF0Y2godGV4dCk7XG5cbiAgICAgIGlmKHBvc2l0aW9uICE9PSAtMSkge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgIGNvbW1hbmRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb24gLSBiLnBvc2l0aW9uO1xuICAgICAgfSlcbiAgICAgIC8vY2FsbCBuZXh0IGNvbW1hbmQgb25seSBhZnRlciBwcmV2aW91cyBvbmUgaGFzIGZpbmlzaGVkXG4gICAgICAucmVkdWNlKChwcm9taXNlLCB7Y29tbWFuZH0pID0+IHtcbiAgICAgICAgaWYoIXByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gY29tbWFuZC5leGVjdXRlKHRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihjb21tYW5kLmV4ZWN1dGUuYmluZChjb21tYW5kLCB0ZXh0KSk7XG4gICAgICB9LCBudWxsKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmRSdW5uZXI7IiwiY2xhc3MgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICB0aGlzLl9yZWdleCA9IC9eJC9pO1xuICAgIHRoaXMuX2NvbW1hbmRSdW5uZXIgPSBjb21tYW5kUnVubmVyO1xuICB9XG5cbiAgbWF0Y2godGV4dCkge1xuICAgIHJldHVybiB0ZXh0LnNlYXJjaCh0aGlzLl9yZWdleCk7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHt0YWJEZWJ1Z2dlciwgcm9vdE5vZGVJZCwgY29udGV4dE5vZGVJZH0pIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgY3NzID0gJzsnICsgdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKSArICc6ICcgKyB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXModGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCksIGNzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRUb1N0eWxlcyhub2RlSWQsIHRleHQpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhbmdlIHN0eWxlcycsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ2NoYW5naW5nIHN0eWxlcyBmcm9tJywgb2xkU3R5bGVWYWx1ZSk7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnNldEF0dHJpYnV0ZVZhbHVlJywge1xuICAgICAgICBub2RlSWQsXG4gICAgICAgIG5hbWU6ICdzdHlsZScsXG4gICAgICAgIHZhbHVlOiBvbGRTdHlsZVZhbHVlICsgdGV4dFxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENTU0NoYW5nZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIGZyb21DU1NWYWx1ZVRvVGV4dH0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NHZXRWYWx1ZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyh3aGF0J3N8d2hhdCBpc3xnZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUodG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKSwgdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ2dldENvbXB1dGVkVmFsdWUnLCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdDU1MuZ2V0Q29tcHV0ZWRTdHlsZUZvck5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgaXRlbSA9IGRhdGEuY29tcHV0ZWRTdHlsZS5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLm5hbWUgPT09IHByb3BlcnR5O1xuICAgICAgfSk7XG5cbiAgICAgIGlmKGl0ZW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5IGZvdW5kISBWYWx1ZTogJyArIGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKSk7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQcm9wZXJ0eSAnICsgcHJvcGVydHkgKyAnIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVOb2RlKHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ3JlbW92ZU5vZGUnLCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVtb3ZlTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdE5vZGUoc2VsZWN0b3IpIHtcbiAgICBjb25zb2xlLmxvZygnc2VsZWN0Tm9kZScsIHNlbGVjdG9yKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcbiAgICBsZXQgcm9vdE5vZGVJZCA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJ05vZGUgZm91bmQuJyk7XG5cbiAgICAgIHRoaXMuX2NvbW1hbmRSdW5uZXIuc2V0Q29udGV4dE5vZGVJZChkYXRhLm5vZGVJZCk7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZ2hsaWdodE5vZGUnLCB7XG4gICAgICAgIGhpZ2hsaWdodENvbmZpZzoge1xuICAgICAgICAgIGNvbnRlbnRDb2xvcjoge1xuICAgICAgICAgICAgcjogMTU1LFxuICAgICAgICAgICAgZzogMTEsXG4gICAgICAgICAgICBiOiAyMzksXG4gICAgICAgICAgICBhOiAwLjdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNob3dJbmZvOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG5vZGVJZDogZGF0YS5ub2RlSWRcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3N0b3AgaGlnaGxpZ2h0aW5nIGFmdGVyIGNvdXBsZSBvZiBzZWNvbmRzXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlkZUhpZ2hsaWdodCcpO1xuICAgICAgICB9LCAzMDAwKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFJlZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC9yZWRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVkb0xhc3RBY3Rpb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCd1bmRvJyk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVkb0NvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFVuZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC91bmRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMudW5kb0xhc3RBY3Rpb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCd1bmRvJyk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVW5kb0NvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVRhYigpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlfSwgKHRhYnMpID0+IHtcbiAgICAgIGlmICh0YWJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZWplY3QoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHRhYnNbMF0pO1xuICAgIH0pXG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJjbGFzcyBMaXN0ZW5lck1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIG5vdGlmeUxpc3RlbmVycyhkYXRhKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRhdGEpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RlbmVyTWFuYWdlcjsiLCJpbXBvcnQgTGlzdGVuZXJNYW5hZ2VyIGZyb20gJy4vbGlzdGVuZXItbWFuYWdlci5qcyc7XG5jb25zdCBBQ1RJVkUgPSAxO1xuY29uc3QgSU5BQ1RJVkUgPSAyO1xuXG5jbGFzcyBTcGVlY2hSZWNvZ25pdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3JlY29nbml0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcblxuICAgIHRoaXMub25SZXN1bHQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gICAgdGhpcy5vbkVuZCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIHZhciByZWNvZ25pdGlvbiA9IG5ldyB3ZWJraXRTcGVlY2hSZWNvZ25pdGlvbigpO1xuICAgIHJlY29nbml0aW9uLmNvbnRpbnVvdXMgPSB0cnVlO1xuICAgIC8vcmVjb2duaXRpb24uaW50ZXJpbVJlc3VsdHMgPSB0cnVlO1xuXG4gICAgcmVjb2duaXRpb24ub25lbmQgPSAoKSA9PiB7XG4gICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgIHRoaXMub25FbmQubm90aWZ5TGlzdGVuZXJzKCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLm9ucmVzdWx0ID0gKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgaW50ZXJpbV90cmFuc2NyaXB0ID0gJycsIGZpbmFsX3RyYW5zY3JpcHQgPSAnJztcblxuICAgICAgZm9yIChsZXQgaSA9IGV2ZW50LnJlc3VsdEluZGV4OyBpIDwgZXZlbnQucmVzdWx0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoZXZlbnQucmVzdWx0c1tpXS5pc0ZpbmFsKSB7XG4gICAgICAgICAgZmluYWxfdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW50ZXJpbV90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnU3BlZWNoUmVjb2duaXRpb24nLCBmaW5hbF90cmFuc2NyaXB0KTtcbiAgICAgIHRoaXMub25SZXN1bHQubm90aWZ5TGlzdGVuZXJzKGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5zdGFydCgpO1xuXG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSByZWNvZ25pdGlvbjtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWNvZ25pdGlvbi5vbnN0YXJ0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBBQ1RJVkU7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHJlY29nbml0aW9uLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICAgIHRoaXMub25FbmQubm90aWZ5TGlzdGVuZXJzKGV2ZW50LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSBBQ1RJVkU7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9yZWNvZ25pdGlvbikge1xuICAgICAgdGhpcy5fcmVjb2duaXRpb24uc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTcGVlY2hSZWNvZ25pdGlvbjtcbiIsImZ1bmN0aW9uIF9hdHRhY2godGFiSWQpIHtcbiAgdmFyIHByb3RvY29sVmVyc2lvbiA9ICcxLjEnO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmF0dGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBwcm90b2NvbFZlcnNpb24sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfZGV0YWNoKHRhYklkKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmRldGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX3NlbmRDb21tYW5kKHRhYklkLCBjb21tYW5kLCBkYXRhID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuc2VuZENvbW1hbmQoe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgY29tbWFuZCwgZGF0YSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNsYXNzIFRhYkRlYnVnZ2VyIHtcbiAgY29uc3RydWN0b3IodGFiSWQpIHtcbiAgICB0aGlzLl90YWJJZCA9IHRhYklkO1xuICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcblxuICAgIGNocm9tZS5kZWJ1Z2dlci5vbkRldGFjaC5hZGRMaXN0ZW5lcigoc291cmNlLCByZWFzb24pID0+IHtcbiAgICAgIGlmKHNvdXJjZS50YWJJZCA9PT0gdGhpcy5fdGFiSWQpIHtcbiAgICAgICAgdGhpcy5fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgcmV0dXJuIF9hdHRhY2godGhpcy5fdGFiSWQpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpe1xuICAgIHJldHVybiBfZGV0YWNoKHRoaXMuX3RhYklkKTtcbiAgfVxuXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZDtcbiAgfVxuXG4gIHNlbmRDb21tYW5kKGNvbW1hbmQsIGRhdGEpIHtcbiAgICBpZighdGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUYWJEZWJ1Z2dlcjsiLCJpbXBvcnQgU3BlZWNoUmVjb2duaXRpb24gZnJvbSAnLi9zcGVlY2gtcmVjb2duaXRpb24uanMnO1xuaW1wb3J0IENvbW1hbmRSdW5uZXIgZnJvbSAnLi9jb21tYW5kLXJ1bm5lci5qcyc7XG5pbXBvcnQgVGFiRGVidWdnZXIgZnJvbSAnLi90YWItZGVidWdnZXIuanMnO1xuaW1wb3J0IHtnZXRBY3RpdmVUYWJ9IGZyb20gJy4vaGVscGVycy90YWJzLmpzJztcblxuaW1wb3J0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMnO1xuaW1wb3J0IENTU0NoYW5nZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtY2hhbmdlLmpzJztcbmltcG9ydCBDU1NHZXRWYWx1ZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3VuZG8uanMnO1xuaW1wb3J0IFJlZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvcmVkby5qcyc7XG5cbmZ1bmN0aW9uIHNob3dSZWNvcmRpbmdJY29uKCkge1xuICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgIHRleHQ6ICfCtydcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGhpZGVSZWNvcmRpbmdJY29uKCkge1xuICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgIHRleHQ6JydcbiAgfSk7XG59XG5cbmxldCBzcGVlY2hSZWNvZ25pdGlvbiA9IG5ldyBTcGVlY2hSZWNvZ25pdGlvbigpO1xubGV0IGNvbW1hbmRSdW5uZXIgPSBuZXcgQ29tbWFuZFJ1bm5lcigpO1xuXG4vL1RPRE8gcmVtb3ZlIG1lXG53aW5kb3cuY3IgPSBjb21tYW5kUnVubmVyO1xuXG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlSW5zcGVjdGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZURlbGV0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NDaGFuZ2VDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0dldFZhbHVlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChVbmRvQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChSZWRvQ29tbWFuZCk7XG5cbmNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICBzcGVlY2hSZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IHRhYkRlYnVnZ2VyO1xuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIC8vVE9ETyByZW1vdmVcbiAgICAgIHdpbmRvdy50ZCA9IHRhYkRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLmNvbm5lY3QoKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHNob3dSZWNvcmRpbmdJY29uKCk7XG5cbiAgICAgIGNvbW1hbmRSdW5uZXIuc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpO1xuXG4gICAgICBzcGVlY2hSZWNvZ25pdGlvbi5vblJlc3VsdC5hZGRMaXN0ZW5lcigodHJhbnNjcmlwdCkgPT4ge1xuICAgICAgICBjb21tYW5kUnVubmVyLnJlY29nbml6ZSh0cmFuc2NyaXB0KTtcbiAgICAgIH0pO1xuICAgICAgc3BlZWNoUmVjb2duaXRpb24ub25FbmQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgICAvL1RPRE8gYWRkXG4gICAgICAgIC8vdGFiRGVidWdnZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICBoaWRlUmVjb3JkaW5nSWNvbigpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgPT0gJ25vdC1hbGxvd2VkJykge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgICAgICBzcGVlY2hSZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHRhYkRlYnVnZ2VyLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgdGFiRGVidWdnZXIuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
