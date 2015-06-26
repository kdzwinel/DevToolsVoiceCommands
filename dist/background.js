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
        tabDebugger.sendCommand('DOM.enable').then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument')).then(function(data) {
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
var $__scripts_47_commands_47_css_45_change_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/css-change.js";
  var Command = ($__scripts_47_command_46_js__).default;
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
  var CSSChangeCommand = function($__super) {
    function CSSChangeCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSChangeCommand).call(this, commandRunner);
      this._regex = /(change|set)( it's)? (\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
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
          return this.selectNode(matches[2] + ', #' + matches[2]);
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
            highlightConfig: {contentColor: {
                r: 255,
                g: 0,
                b: 0,
                a: 0.7
              }},
            nodeId: data.nodeId
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
var $__scripts_47_helpers_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/helpers.js";
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
  var getActiveTab = ($__scripts_47_helpers_46_js__).getActiveTab;
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvaGVscGVycy5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLDhCQUFvQixDQUFDO0lDQTlCLGNBQVksRUFBbEIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGNBQVksQ0FDSixBQUFELENBQUc7QUFDWixTQUFHLGFBQWEsRUFBSSxLQUFHLENBQUM7QUFDeEIsU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLFVBQVUsRUFBSSxJQUFJLElBQUUsQUFBQyxFQUFDLENBQUM7SUFDNUI7QUFpRUYsQUFyRVUsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQU01QyxtQkFBYSxDQUFiLFVBQWUsV0FBVTs7QUFDdkIsV0FBRyxhQUFhLEVBQUksWUFBVSxDQUFDO0FBRS9CLGtCQUFVLFlBQVksQUFBQyxDQUFDLFlBQVcsQ0FBQyxLQUM5QixBQUFDLENBQUMsV0FBVSxZQUFZLEtBQUssQUFBQyxDQUFDLFdBQVUsQ0FBRyxrQkFBZ0IsQ0FBQyxDQUFDLEtBQzlELEFBQUMsQ0FBQyxTQUFDLElBQUcsQ0FBTTtBQUNkLGFBQUcsQ0FBQyxJQUFH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RUFBQyxDQUFDO0lBQzlCLENBQUMsS0FDRyxBQUFDLENBQUMsU0FBQyxBQUFEO0FBQ0osc0JBQWdCLEFBQUMsRUFBQyxDQUFDO0FBRW5CLGtCQUFZLGVBQWUsQUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFDO0FBRXpDLHNCQUFnQixTQUFTLFlBQVksQUFBQyxDQUFDLFNBQUMsVUFBUyxDQUFNO0FBQ3JELG9CQUFZLFVBQVUsQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO01BQ3JDLENBQUMsQ0FBQztBQUNGLHNCQUFnQixNQUFNLFlBQVksQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBR3hDLHdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNyQixDQUFDLENBQUM7SUFDSixDQUFDLE1BQU0sQUFBQyxDQUFDLFNBQUMsS0FBSSxDQUFNO0FBQ2xCLFNBQUksS0FBSSxHQUFLLGNBQVksQ0FBRztBQUMxQixhQUFLLFFBQVEsZ0JBQWdCLEFBQUMsRUFBQyxDQUFDO01BQ2xDO0FBQUEsQUFFQSxTQUFHLGlCQUFnQixTQUFTLEFBQUMsRUFBQyxDQUFHO0FBQy9CLHdCQUFnQixLQUFLLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxTQUFHLFdBQVUsWUFBWSxBQUFDLEVBQUMsQ0FBRztBQUM1QixrQkFBVSxXQUFXLEFBQUMsRUFBQyxDQUFDO01BQzFCO0FBQUEsQUFFQSxZQUFNLElBQUksQUFBQyxDQUFDLEtBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQztFQUNOLENBQUMsQ0FBQztBQWhGRixXQUF1QiIsImZpbGUiOiIvVXNlcnMva2R6d2luZWwvUHJvamVjdHMvT1MvRGV2VG9vbHNWb2ljZUNvbW1hbmRzL3RlbXBvdXRNQzR3TWpFNU56VTJNVE0yTmpRNE16VTJPUXJlZHJlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kcyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIHNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSB0YWJEZWJ1Z2dlcjtcblxuICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZW5hYmxlJylcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBkYXRhLnJvb3Qubm9kZUlkO1xuICAgICAgfSk7XG4gIH1cblxuICBnZXRUYWJEZWJ1Z2dlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFiRGVidWdnZXI7XG4gIH1cblxuICBnZXRDb250ZXh0Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0Tm9kZUlkO1xuICB9XG5cbiAgc2V0Q29udGV4dE5vZGVJZChpZCkge1xuICAgIHRoaXMuX2NvbnRleHROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICByZWdpc3RlckNvbW1hbmQoY29tbWFuZFR5cGUpIHtcbiAgICB0aGlzLl9jb21tYW5kcy5hZGQobmV3IGNvbW1hbmRUeXBlKHRoaXMpKTtcbiAgfVxuXG4gIHJlY29nbml6ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICAgIC8vZmlndXJlIG91dCB0aGUgb3JkZXIgaW4gd2hpY2ggY29tbWFuZHMgc2hvdWxkIGJlIGNhbGxlZCAobXVzdCBiZSB0aGUgc2FtZSBhcyBpbiB0aGUgdGV4dClcbiAgICB0aGlzLl9jb21tYW5kcy5mb3JFYWNoKChjb21tYW5kKSA9PiB7XG4gICAgICBsZXQgcG9zaXRpb24gPSBjb21tYW5kLm1hdGNoKHRleHQpO1xuXG4gICAgICBpZihwb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBjb21tYW5kXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBhLnBvc2l0aW9uIC0gYi5wb3NpdGlvbjtcbiAgICAgIH0pXG4gICAgICAvL2NhbGwgbmV4dCBjb21tYW5kIG9ubHkgYWZ0ZXIgcHJldmlvdXMgb25lIGhhcyBmaW5pc2hlZFxuICAgICAgLnJlZHVjZSgocHJvbWlzZSwge2NvbW1hbmR9KSA9PiB7XG4gICAgICAgIGlmKCFwcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1hbmQuZXhlY3V0ZSh0ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCkpO1xuICAgICAgfSwgbnVsbCk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kUnVubmVyOyIsImNsYXNzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgICB0aGlzLl9jb21tYW5kUnVubmVyID0gY29tbWFuZFJ1bm5lcjtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB7dGFiRGVidWdnZXIsIHJvb3ROb2RlSWQsIGNvbnRleHROb2RlSWR9KSB7XG5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5mdW5jdGlvbiB0b0NTU1Byb3BlcnR5KHRleHQpIHtcbiAgcmV0dXJuIHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcgJywgJy0nKTtcbn1cblxubGV0IGNzc1VuaXRzID0ge1xuICBwaXhlbDogJ3B4JyxcbiAgcGl4ZWxzOiAncHgnLFxuICBlbTogJ2VtJyxcbiAgZW1zOiAnZW0nLFxuICBwZXJjZW50OiAnJSdcbn07XG5cbmZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5jbGFzcyBDU1NDaGFuZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oY2hhbmdlfHNldCkoIGl0J3MpPyAoXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBjc3MgPSAnOycgKyB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pICsgJzogJyArIHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSkgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSwgY3NzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGFuZ2Ugc3R5bGVzJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnY2hhbmdpbmcgc3R5bGVzIGZyb20nLCBvbGRTdHlsZVZhbHVlKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZURlbGV0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGRlbGV0ZXxyZW1vdmUpIGl0L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTm9kZSh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVOb2RlKG5vZGVJZCkge1xuICAgIGNvbnNvbGUubG9nKCdyZW1vdmVOb2RlJywgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlbW92ZU5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTm9kZURlbGV0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZUluc3BlY3Rpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oc2VsZWN0fGluc3BlY3QpIChcXHcrKS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5vZGUobWF0Y2hlc1syXSArICcsICMnICsgbWF0Y2hlc1syXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3ROb2RlKHNlbGVjdG9yKSB7XG4gICAgY29uc29sZS5sb2coJ3NlbGVjdE5vZGUnLCBzZWxlY3Rvcik7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG4gICAgbGV0IHJvb3ROb2RlSWQgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFJvb3ROb2RlSWQoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnF1ZXJ5U2VsZWN0b3InLCB7XG4gICAgICBub2RlSWQ6IHJvb3ROb2RlSWQsXG4gICAgICBzZWxlY3RvclxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGlmKCFkYXRhLm5vZGVJZCkge1xuICAgICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCdOb2RlIGZvdW5kLicpO1xuXG4gICAgICB0aGlzLl9jb21tYW5kUnVubmVyLnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWdobGlnaHROb2RlJywge1xuICAgICAgICBoaWdobGlnaHRDb25maWc6IHtcbiAgICAgICAgICBjb250ZW50Q29sb3I6IHtcbiAgICAgICAgICAgIHI6IDI1NSxcbiAgICAgICAgICAgIGc6IDAsXG4gICAgICAgICAgICBiOiAwLFxuICAgICAgICAgICAgYTogMC43XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBub2RlSWQ6IGRhdGEubm9kZUlkXG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTm9kZUluc3BlY3Rpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBSZWRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvcmVkby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZWRvTGFzdEFjdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygndW5kbycpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVkbycpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlZG9Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBVbmRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvdW5kby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICB1bmRvTGFzdEFjdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygndW5kbycpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00udW5kbycpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFVuZG9Db21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVUYWIoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZX0sICh0YWJzKSA9PiB7XG4gICAgICBpZiAodGFicy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSh0YWJzWzBdKTtcbiAgICB9KVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiY2xhc3MgTGlzdGVuZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBub3RpZnlMaXN0ZW5lcnMoZGF0YSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihkYXRhKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0ZW5lck1hbmFnZXI7IiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuY29uc3QgQUNUSVZFID0gMTtcbmNvbnN0IElOQUNUSVZFID0gMjtcblxuY2xhc3MgU3BlZWNoUmVjb2duaXRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG5cbiAgICB0aGlzLm9uUmVzdWx0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICAgIHRoaXMub25FbmQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZWNvZ25pdGlvbi5jb250aW51b3VzID0gdHJ1ZTtcbiAgICAvL3JlY29nbml0aW9uLmludGVyaW1SZXN1bHRzID0gdHJ1ZTtcblxuICAgIHJlY29nbml0aW9uLm9uZW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5vbnJlc3VsdCA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IGludGVyaW1fdHJhbnNjcmlwdCA9ICcnLCBmaW5hbF90cmFuc2NyaXB0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGkgPSBldmVudC5yZXN1bHRJbmRleDsgaSA8IGV2ZW50LnJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGV2ZW50LnJlc3VsdHNbaV0uaXNGaW5hbCkge1xuICAgICAgICAgIGZpbmFsX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludGVyaW1fdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1NwZWVjaFJlY29nbml0aW9uJywgZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgICB0aGlzLm9uUmVzdWx0Lm5vdGlmeUxpc3RlbmVycyhmaW5hbF90cmFuc2NyaXB0KTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICAgIHRoaXMuX3JlY29nbml0aW9uID0gcmVjb2duaXRpb247XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gQUNUSVZFO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycyhldmVudC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gQUNUSVZFO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb2duaXRpb24pIHtcbiAgICAgIHRoaXMuX3JlY29nbml0aW9uLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3BlZWNoUmVjb2duaXRpb247XG4iLCJmdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgIHJlamVjdChyZXNwb25zZS5lcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jbGFzcyBUYWJEZWJ1Z2dlciB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcbiAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG5cbiAgICBjaHJvbWUuZGVidWdnZXIub25EZXRhY2guYWRkTGlzdGVuZXIoKHNvdXJjZSwgcmVhc29uKSA9PiB7XG4gICAgICBpZihzb3VyY2UudGFiSWQgPT09IHRoaXMuX3RhYklkKSB7XG4gICAgICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHJldHVybiBfYXR0YWNoKHRoaXMuX3RhYklkKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKXtcbiAgICByZXR1cm4gX2RldGFjaCh0aGlzLl90YWJJZCk7XG4gIH1cblxuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWQ7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kLCBkYXRhKSB7XG4gICAgaWYoIXRoaXMuX2F0dGFjaGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFiRGVidWdnZXI7IiwiaW1wb3J0IFNwZWVjaFJlY29nbml0aW9uIGZyb20gJy4vc3BlZWNoLXJlY29nbml0aW9uLmpzJztcbmltcG9ydCBDb21tYW5kUnVubmVyIGZyb20gJy4vY29tbWFuZC1ydW5uZXIuanMnO1xuaW1wb3J0IFRhYkRlYnVnZ2VyIGZyb20gJy4vdGFiLWRlYnVnZ2VyLmpzJztcbmltcG9ydCB7Z2V0QWN0aXZlVGFifSBmcm9tICcuL2hlbHBlcnMuanMnO1xuXG5pbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzJztcbmltcG9ydCBOb2RlRGVsZXRpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1kZWxldGlvbi5qcyc7XG5pbXBvcnQgQ1NTQ2hhbmdlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IFVuZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvdW5kby5qcyc7XG5pbXBvcnQgUmVkb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9yZWRvLmpzJztcblxuZnVuY3Rpb24gc2hvd1JlY29yZGluZ0ljb24oKSB7XG4gIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgdGV4dDogJ8K3J1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaGlkZVJlY29yZGluZ0ljb24oKSB7XG4gIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgdGV4dDonJ1xuICB9KTtcbn1cblxubGV0IHNwZWVjaFJlY29nbml0aW9uID0gbmV3IFNwZWVjaFJlY29nbml0aW9uKCk7XG5sZXQgY29tbWFuZFJ1bm5lciA9IG5ldyBDb21tYW5kUnVubmVyKCk7XG5cbi8vVE9ETyByZW1vdmUgbWVcbndpbmRvdy5jciA9IGNvbW1hbmRSdW5uZXI7XG5cbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVJbnNwZWN0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlRGVsZXRpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0NoYW5nZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5jaHJvbWUuYnJvd3NlckFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBpZihzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCB0YWJEZWJ1Z2dlcjtcblxuICBzcGVlY2hSZWNvZ25pdGlvblxuICAgIC5zdGFydCgpXG4gICAgLnRoZW4oZ2V0QWN0aXZlVGFiKVxuICAgIC50aGVuKCh0YWIpID0+IHtcbiAgICAgIHRhYkRlYnVnZ2VyID0gbmV3IFRhYkRlYnVnZ2VyKHRhYi5pZCk7XG4gICAgICAvL1RPRE8gcmVtb3ZlXG4gICAgICB3aW5kb3cudGQgPSB0YWJEZWJ1Z2dlcjtcbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5jb25uZWN0KCk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBzaG93UmVjb3JkaW5nSWNvbigpO1xuXG4gICAgICBjb21tYW5kUnVubmVyLnNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKTtcblxuICAgICAgc3BlZWNoUmVjb2duaXRpb24ub25SZXN1bHQuYWRkTGlzdGVuZXIoKHRyYW5zY3JpcHQpID0+IHtcbiAgICAgICAgY29tbWFuZFJ1bm5lci5yZWNvZ25pemUodHJhbnNjcmlwdCk7XG4gICAgICB9KTtcbiAgICAgIHNwZWVjaFJlY29nbml0aW9uLm9uRW5kLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgICAgICAgLy9UT0RPIGFkZFxuICAgICAgICAvL3RhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgaGlkZVJlY29yZGluZ0ljb24oKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yID09ICdub3QtYWxsb3dlZCcpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZih0YWJEZWJ1Z2dlci5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICAgIHRhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufSk7Il19
