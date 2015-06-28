var $__scripts_47_lib_47_command_45_context_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command-context.js";
  var CommandContext = function() {
    function CommandContext() {
      this._rootNodeId = null;
      this._contextNodeId = null;
      this._contextCSSPropertyName = null;
    }
    return ($traceurRuntime.createClass)(CommandContext, {
      getContextNodeId: function() {
        return this._contextNodeId;
      },
      setContextNodeId: function(id) {
        this._contextNodeId = id;
      },
      setRootNodeId: function(id) {
        this._rootNodeId = id;
      },
      getRootNodeId: function() {
        return this._rootNodeId;
      },
      setContextCSSPropertyName: function(name) {
        this._contextCSSPropertyName = name;
      },
      getContextCSSPropertyName: function() {
        return this._contextCSSPropertyName;
      }
    }, {});
  }();
  var $__default = CommandContext;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_command_45_runner_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command-runner.js";
  var CommandContext = ($__scripts_47_lib_47_command_45_context_46_js__).default;
  var CommandRunner = function() {
    function CommandRunner() {
      this._tabDebugger = null;
      this._commandContext = new CommandContext();
      this._commands = new Set();
    }
    return ($traceurRuntime.createClass)(CommandRunner, {
      setTabDebugger: function(tabDebugger) {
        var $__1 = this;
        this._tabDebugger = tabDebugger;
        tabDebugger.sendCommand('DOM.enable').then(tabDebugger.sendCommand.bind(tabDebugger, 'CSS.enable')).then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument')).then(function(data) {
          if (!data.root) {
            throw new Error('Document root not available.');
          }
          $__1._commandContext.setRootNodeId(data.root.nodeId);
        });
      },
      registerCommand: function(commandType) {
        this._commands.add(new commandType());
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
        var tabDebugger = this._tabDebugger;
        var commandContext = this._commandContext;
        var dummyPromise = new Promise(function(resolve, reject) {
          resolve();
        });
        return matches.sort(function(a, b) {
          return a.position - b.position;
        }).reduce(function(promise, $__3) {
          var command = $__3.command;
          var nextCommand = command.execute.bind(command, text, tabDebugger, commandContext);
          return promise.then(nextCommand);
        }, dummyPromise);
      }
    }, {});
  }();
  var $__default = CommandRunner;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_command_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command.js";
  var Command = function() {
    function Command() {
      this._regex = /^$/i;
    }
    return ($traceurRuntime.createClass)(Command, {
      match: function(text) {
        return text.search(this._regex);
      },
      execute: function(text, tabDebugger, commandContext) {}
    }, {});
  }();
  var $__default = Command;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_helpers_47_css_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/helpers/css.js";
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
var $__scripts_47_lib_47_commands_47_css_45_change_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/css-change.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var $__1 = $__scripts_47_lib_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      toCSSValue = $__1.toCSSValue;
  var CSSChangeCommand = function($__super) {
    function CSSChangeCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSChangeCommand).call(this, commandRunner);
      this._regex = /(change|set) (its )?(\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
    }
    return ($traceurRuntime.createClass)(CSSChangeCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          var property = toCSSProperty(matches[3]);
          var value = toCSSValue(matches[5], matches[6]);
          if (matches[3] === 'it') {
            property = commandContext.getContextCSSPropertyName();
          }
          commandContext.setContextCSSPropertyName(property);
          var css = ';' + property + ': ' + value + ';';
          return this.appendToStyles(commandContext.getContextNodeId(), css, tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      appendToStyles: function(nodeId, text, tabDebugger) {
        console.log('CSSChangeCommand', nodeId, text);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
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
          }).then(function() {
            tabDebugger.sendCommand('DOM.markUndoableState');
          });
        }).catch(function() {
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
var $__scripts_47_lib_47_commands_47_css_45_get_45_value_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/css-get-value.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var $__1 = $__scripts_47_lib_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      fromCSSValueToText = $__1.fromCSSValueToText;
  var CSSGetValueCommand = function($__super) {
    function CSSGetValueCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSGetValueCommand).call(this, commandRunner);
      this._regex = /(what's|what is|get)( its)? (\w+( \w+)?)/i;
    }
    return ($traceurRuntime.createClass)(CSSGetValueCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          var property = toCSSProperty(matches[3]);
          commandContext.setContextCSSPropertyName(property);
          return this.getComputedValue(property, commandContext.getContextNodeId(), tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      getComputedValue: function(property, nodeId, tabDebugger) {
        console.log('CSSGetValueCommand', property, nodeId);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
        return tabDebugger.sendCommand('CSS.getComputedStyleForNode', {nodeId: nodeId}).then(function(data) {
          var item = data.computedStyle.find(function(item) {
            return item.name === property;
          });
          if (item) {
            return property + ' value is ' + fromCSSValueToText(item.value);
          } else {
            return 'Property ' + property + ' not found.';
          }
        }).catch(function() {
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSGetValueCommand.description = "Get computed CSS property value of currently inspected node by saying \"get its x\" or \"what's its x\" (where \"x\" is the name of the CSS property).";
  var $__default = CSSGetValueCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_commands_47_node_45_deletion_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/node-deletion.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var NodeDeletionCommand = function($__super) {
    function NodeDeletionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeDeletionCommand).call(this, commandRunner);
      this._regex = /(delete|remove) it/i;
    }
    return ($traceurRuntime.createClass)(NodeDeletionCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.removeNode(commandContext.getContextNodeId(), tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      removeNode: function(nodeId, tabDebugger) {
        console.log('NodeDeletionCommand', nodeId);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
        return tabDebugger.sendCommand('DOM.removeNode', {nodeId: nodeId}).then(function() {
          tabDebugger.sendCommand('DOM.markUndoableState');
        }).catch(function() {
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
var $__scripts_47_lib_47_commands_47_node_45_inspection_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/node-inspection.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var HIGHLIGHT_COLOR = {
    r: 155,
    g: 11,
    b: 239,
    a: 0.7
  };
  var HIGHLIGHT_TIMEOUT = 2000;
  var NodeInspectionCommand = function($__super) {
    function NodeInspectionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeInspectionCommand).call(this, commandRunner);
      this._regex = /(select|inspect) (\w+)/i;
    }
    return ($traceurRuntime.createClass)(NodeInspectionCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.selectNode(matches[2] + ', #' + matches[2] + ', .' + matches[2], tabDebugger, commandContext);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      selectNode: function(selector, tabDebugger, commandContext) {
        console.log('NodeInspectionCommand', selector);
        var rootNodeId = commandContext.getRootNodeId();
        return tabDebugger.sendCommand('DOM.querySelector', {
          nodeId: rootNodeId,
          selector: selector
        }).then(function(data) {
          if (!data.nodeId) {
            throw new Error('Node not found.');
          }
          commandContext.setContextNodeId(data.nodeId);
          commandContext.setContextCSSPropertyName(null);
          return tabDebugger.sendCommand('DOM.highlightNode', {
            highlightConfig: {
              contentColor: HIGHLIGHT_COLOR,
              showInfo: true
            },
            nodeId: data.nodeId
          }).then(function() {
            setTimeout(function() {
              tabDebugger.sendCommand('DOM.hideHighlight');
            }, HIGHLIGHT_TIMEOUT);
          });
        }).catch(function() {
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
var $__scripts_47_lib_47_commands_47_redo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/redo.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var RedoCommand = function($__super) {
    function RedoCommand(commandRunner) {
      $traceurRuntime.superConstructor(RedoCommand).call(this, commandRunner);
      this._regex = /redo/i;
    }
    return ($traceurRuntime.createClass)(RedoCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.redoLastAction(tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      redoLastAction: function(tabDebugger) {
        console.log('RedoCommand');
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
var $__scripts_47_lib_47_commands_47_undo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/undo.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var UndoCommand = function($__super) {
    function UndoCommand(commandRunner) {
      $traceurRuntime.superConstructor(UndoCommand).call(this, commandRunner);
      this._regex = /undo/i;
    }
    return ($traceurRuntime.createClass)(UndoCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.undoLastAction(tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      undoLastAction: function(tabDebugger) {
        console.log('UndoCommand');
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
var $__scripts_47_lib_47_helpers_47_tabs_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/helpers/tabs.js";
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
var $__scripts_47_lib_47_injected_45_console_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/injected-console.js";
  var InjectedConsole = function() {
    function InjectedConsole(tabId) {
      this._tabId = tabId;
      chrome.tabs.executeScript(tabId, {file: 'bower_components/traceur-runtime/traceur-runtime.min.js'}, function() {
        chrome.tabs.executeScript(tabId, {file: 'dist/content-script.js'});
      });
    }
    return ($traceurRuntime.createClass)(InjectedConsole, {
      logMessage: function(text) {
        chrome.tabs.sendMessage(this._tabId, {
          type: 'log',
          content: text
        });
      },
      destroy: function() {
        chrome.tabs.sendMessage(this._tabId, {type: 'destroy'});
      }
    }, {});
  }();
  var $__default = InjectedConsole;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_recording_45_icon_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/recording-icon.js";
  var IDLE = 1;
  var RECORDING = 2;
  var RecordingIcon = function() {
    function RecordingIcon() {}
    return ($traceurRuntime.createClass)(RecordingIcon, {
      construct: function() {
        this._status = IDLE;
        this._animationInterval = null;
      },
      show: function() {
        this._status = RECORDING;
        var i = 0;
        var animation = ' ·';
        function updateFrame() {
          var frame = animation[i % animation.length];
          i++;
          chrome.browserAction.setBadgeText({text: frame});
        }
        updateFrame();
        this._animationInterval = setInterval(updateFrame, 150);
      },
      hide: function() {
        this._status = IDLE;
        if (this._animationInterval) {
          clearInterval(this._animationInterval);
        }
        chrome.browserAction.setBadgeText({text: ''});
      }
    }, {});
  }();
  var $__default = RecordingIcon;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_lib_47_listener_45_manager_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/listener-manager.js";
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
var $__scripts_47_lib_47_speech_45_recognition_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/speech-recognition.js";
  var ListenerManager = ($__scripts_47_lib_47_listener_45_manager_46_js__).default;
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
var $__scripts_47_lib_47_tab_45_debugger_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/tab-debugger.js";
  var ListenerManager = ($__scripts_47_lib_47_listener_45_manager_46_js__).default;
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
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
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
      var $__1 = this;
      this._tabId = tabId;
      this._attached = true;
      this.onDisconnect = new ListenerManager();
      chrome.debugger.onDetach.addListener(function(source, reason) {
        if (source.tabId === $__1._tabId) {
          $__1._attached = false;
          $__1.onDisconnect.notifyListeners();
        }
      });
    }
    return ($traceurRuntime.createClass)(TabDebugger, {
      connect: function() {
        var $__1 = this;
        return _attach(this._tabId).then(function() {
          $__1._attached = true;
        });
      },
      disconnect: function() {
        return _detach(this._tabId);
      },
      isConnected: function() {
        return this._attached;
      },
      sendCommand: function(command, data) {
        var $__1 = this;
        if (!this._attached) {
          return this.connect().then(function() {
            return _sendCommand($__1._tabId, command, data);
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
var $__scripts_47_lib_47_text_45_to_45_speech_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/text-to-speech.js";
  var TextToSpeech = function() {
    function TextToSpeech() {}
    return ($traceurRuntime.createClass)(TextToSpeech, {speak: function(text) {
        var options = {
          enqueue: true,
          voiceName: localStorage.getItem('voiceName')
        };
        chrome.tts.speak(text, options);
      }}, {});
  }();
  var $__default = TextToSpeech;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_background_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/background.js";
  var SpeechRecognition = ($__scripts_47_lib_47_speech_45_recognition_46_js__).default;
  var CommandRunner = ($__scripts_47_lib_47_command_45_runner_46_js__).default;
  var TabDebugger = ($__scripts_47_lib_47_tab_45_debugger_46_js__).default;
  var getActiveTab = ($__scripts_47_lib_47_helpers_47_tabs_46_js__).getActiveTab;
  var RecordingIcon = ($__scripts_47_lib_47_recording_45_icon_46_js__).default;
  var TextToSpeech = ($__scripts_47_lib_47_text_45_to_45_speech_46_js__).default;
  var InjectedConsole = ($__scripts_47_lib_47_injected_45_console_46_js__).default;
  var NodeInspectionCommand = ($__scripts_47_lib_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_lib_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_lib_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_lib_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_lib_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_lib_47_commands_47_redo_46_js__).default;
  var textToSpeech = new TextToSpeech();
  var recordingIcon = new RecordingIcon();
  var commandRunner = new CommandRunner();
  commandRunner.registerCommand(NodeInspectionCommand);
  commandRunner.registerCommand(NodeDeletionCommand);
  commandRunner.registerCommand(CSSChangeCommand);
  commandRunner.registerCommand(CSSGetValueCommand);
  commandRunner.registerCommand(UndoCommand);
  commandRunner.registerCommand(RedoCommand);
  var speechRecognition = new SpeechRecognition();
  var tabDebugger = null;
  var injectedConsole = null;
  speechRecognition.onResult.addListener(function(transcript) {
    injectedConsole.logMessage(("&#9834; \"" + transcript + "\""));
    commandRunner.recognize(transcript).then(function(result) {
      if (result && typeof result === 'string') {
        injectedConsole.logMessage('&#10145; ' + result);
        textToSpeech.speak(result);
      }
    }).catch(function(error) {
      if (error) {
        injectedConsole.logMessage('&#9762; Error: ' + error.message);
        textToSpeech.speak(error.message);
      }
    });
  });
  speechRecognition.onEnd.addListener(function() {
    if (tabDebugger && tabDebugger.isConnected()) {
      tabDebugger.disconnect();
    }
    recordingIcon.hide();
    if (injectedConsole) {
      injectedConsole.destroy();
    }
  });
  chrome.browserAction.onClicked.addListener(function() {
    if (speechRecognition.isActive()) {
      speechRecognition.stop();
      return;
    }
    speechRecognition.start().then(getActiveTab).then(function(tab) {
      tabDebugger = new TabDebugger(tab.id);
      tabDebugger.onDisconnect.addListener(function() {
        speechRecognition.stop();
      });
      injectedConsole = new InjectedConsole(tab.id);
      window.ic = injectedConsole;
      return tabDebugger.connect();
    }).then(function() {
      recordingIcon.show();
      commandRunner.setTabDebugger(tabDebugger);
    }).catch(function(error) {
      if (error == 'not-allowed') {
        chrome.runtime.openOptionsPage();
      }
      if (speechRecognition.isActive()) {
        speechRecognition.stop();
      }
      console.log(error);
    });
  });
  return {};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvbGliL2NvbW1hbmQtY29udGV4dC5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmQtcnVubmVyLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZC5qcyIsInNjcmlwdHMvbGliL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvY3NzLWNoYW5nZS5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2xpYi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2xpYi9oZWxwZXJzL3RhYnMuanMiLCJzY3JpcHRzL2xpYi9pbmplY3RlZC1jb25zb2xlLmpzIiwic2NyaXB0cy9saWIvcmVjb3JkaW5nLWljb24uanMiLCJzY3JpcHRzL2xpYi9saXN0ZW5lci1tYW5hZ2VyLmpzIiwic2NyaXB0cy9saWIvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy9saWIvdGFiLWRlYnVnZ2VyLmpzIiwic2NyaXB0cy9saWIvdGV4dC10by1zcGVlY2guanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLG1DQUFvQixDQUFDO0lDQTlCLGVBQWEsRUFBbkIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGVBQWEsQ0FDTCxBQUFELENBQUc7QUFDWixTQUFHLFlBQVksRUFBSSxLQUFHLENBQUM7QUFDdkIsU0FBRyxlQUFlLEVBQUksS0FBRyxDQUFDO0FBQzFCLFNBQUcsd0JBQXdCLEVBQUksS0FBRyxDQUFDO0lBQ3JDO0FBeUJGLEFBNUJVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFLNUMscUJB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QUFDN0MsV0FBSyxHQUFHLEVBQUksZ0JBQWMsQ0FBQztBQUUzQixXQUFPLENBQUEsV0FBVSxRQUFRLEFBQUMsRUFBQyxDQUFDO0lBQzlCLENBQUMsS0FDRyxBQUFDLENBQUMsU0FBQyxBQUFELENBQU07QUFDVixrQkFBWSxLQUFLLEFBQUMsRUFBQyxDQUFDO0FBQ3BCLGtCQUFZLGVBQWUsQUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUMsTUFBTSxBQUFDLENBQUMsU0FBQyxLQUFJLENBQU07QUFDbEIsU0FBSSxLQUFJLEdBQUssY0FBWSxDQUFHO0FBQzFCLGFBQUssUUFBUSxnQkFBZ0IsQUFBQyxFQUFDLENBQUM7TUFDbEM7QUFBQSxBQUVBLFNBQUksaUJBQWdCLFNBQVMsQUFBQyxFQUFDLENBQUc7QUFDaEMsd0JBQWdCLEtBQUssQUFBQyxFQUFDLENBQUM7TUFDMUI7QUFBQSxBQUVBLFlBQU0sSUFBSSxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0FBMUZGLFdBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9rZHp3aW5lbC9Qcm9qZWN0cy9PUy9EZXZUb29sc1ZvaWNlQ29tbWFuZHMvdGVtcG91dE1DNDVPRGMxTmpreU5qWXlNekUzTXpBMi5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZENvbnRleHQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbnVsbDtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgc2V0Um9vdE5vZGVJZChpZCkge1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbmFtZTtcbiAgfVxuXG4gIGdldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZENvbnRleHQ7IiwiaW1wb3J0IENvbW1hbmRDb250ZXh0IGZyb20gJy4vY29tbWFuZC1jb250ZXh0LmpzJztcblxuY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kQ29udGV4dCA9IG5ldyBDb21tYW5kQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbW1hbmRzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IHRhYkRlYnVnZ2VyO1xuXG4gICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5lbmFibGUnKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0NTUy5lbmFibGUnKSlcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1hbmRDb250ZXh0LnNldFJvb3ROb2RlSWQoZGF0YS5yb290Lm5vZGVJZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUoKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX3RhYkRlYnVnZ2VyO1xuICAgIGxldCBjb21tYW5kQ29udGV4dCA9IHRoaXMuX2NvbW1hbmRDb250ZXh0O1xuICAgIGxldCBkdW1teVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb24gLSBiLnBvc2l0aW9uO1xuICAgICAgfSlcbiAgICAgIC8vY2FsbCBuZXh0IGNvbW1hbmQgb25seSBhZnRlciBwcmV2aW91cyBvbmUgaGFzIGZpbmlzaGVkXG4gICAgICAucmVkdWNlKChwcm9taXNlLCB7Y29tbWFuZH0pID0+IHtcbiAgICAgICAgbGV0IG5leHRDb21tYW5kID0gY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihuZXh0Q29tbWFuZCk7XG4gICAgICB9LCBkdW1teVByb21pc2UpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSAoaXRzICk/KFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG4gICAgICBsZXQgdmFsdWUgPSB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pO1xuXG4gICAgICBpZihtYXRjaGVzWzNdID09PSAnaXQnKSB7XG4gICAgICAgIHByb3BlcnR5ID0gY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZSgpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcblxuICAgICAgbGV0IGNzcyA9ICc7JyArIHByb3BlcnR5ICsgJzogJyArIHZhbHVlICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXMoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MsIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnQ1NTQ2hhbmdlQ29tbWFuZCcsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy9hbGxvdyB1bmRvaW5nIGF0dHJpYnV0ZSBjaGFuZ2VcbiAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5tYXJrVW5kb2FibGVTdGF0ZScpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NDaGFuZ2VDb21tYW5kLmRlc2NyaXB0aW9uID0gYENoYW5nZSBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImNoYW5nZSBpdHMgeCB0byB5XCIgb3IgXCJzZXQgaXRzIHggdG8geVwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IGFuZCBcInlcIiBpcyB0aGUgbmV3IHZhbHVlKS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NDaGFuZ2VDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCBmcm9tQ1NTVmFsdWVUb1RleHR9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTR2V0VmFsdWVDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8od2hhdCdzfHdoYXQgaXN8Z2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUocHJvcGVydHkpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBub2RlSWQsIHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ0NTU0dldFZhbHVlQ29tbWFuZCcsIHByb3BlcnR5LCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRleHQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdDU1MuZ2V0Q29tcHV0ZWRTdHlsZUZvck5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgaXRlbSA9IGRhdGEuY29tcHV0ZWRTdHlsZS5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLm5hbWUgPT09IHByb3BlcnR5O1xuICAgICAgfSk7XG5cbiAgICAgIGlmKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5ICsgJyB2YWx1ZSBpcyAnICsgZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdQcm9wZXJ0eSAnICsgcHJvcGVydHkgKyAnIG5vdCBmb3VuZC4nO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTR2V0VmFsdWVDb21tYW5kLmRlc2NyaXB0aW9uID0gYEdldCBjb21wdXRlZCBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImdldCBpdHMgeFwiIG9yIFwid2hhdCdzIGl0cyB4XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0dldFZhbHVlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZURlbGV0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGRlbGV0ZXxyZW1vdmUpIGl0L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVOb2RlKGNvbW1hbmRDb250ZXh0LmdldENvbnRleHROb2RlSWQoKSwgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlTm9kZShub2RlSWQsIHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ05vZGVEZWxldGlvbkNvbW1hbmQnLCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRleHQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVtb3ZlTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy9hbGxvdyB1bmRvaW5nIG5vZGUgcmVtb3ZhbFxuICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5tYXJrVW5kb2FibGVTdGF0ZScpO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZURlbGV0aW9uQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBSZW1vdmUgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIHdpdGggXCJyZW1vdmUgaXRcIiBvciBcImRlbGV0ZSBpdFwiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVEZWxldGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNvbnN0IEhJR0hMSUdIVF9DT0xPUiA9IHtcbiAgcjogMTU1LFxuICBnOiAxMSxcbiAgYjogMjM5LFxuICBhOiAwLjdcbn07XG5jb25zdCBISUdITElHSFRfVElNRU9VVCA9IDIwMDA7XG5cbmNsYXNzIE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHNlbGVjdHxpbnNwZWN0KSAoXFx3KykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWxlY3ROb2RlKG1hdGNoZXNbMl0gKyAnLCAjJyArIG1hdGNoZXNbMl0gKyAnLCAuJyArIG1hdGNoZXNbMl0sIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3ROb2RlKHNlbGVjdG9yLCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBjb25zb2xlLmxvZygnTm9kZUluc3BlY3Rpb25Db21tYW5kJywgc2VsZWN0b3IpO1xuXG4gICAgbGV0IHJvb3ROb2RlSWQgPSBjb21tYW5kQ29udGV4dC5nZXRSb290Tm9kZUlkKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5xdWVyeVNlbGVjdG9yJywge1xuICAgICAgbm9kZUlkOiByb290Tm9kZUlkLFxuICAgICAgc2VsZWN0b3JcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAvL3doZW4gbm8gcmVzdWx0cyBBUEkgcmV0dXJucyBub2RlSWQgPT09IDBcbiAgICAgIGlmKCFkYXRhLm5vZGVJZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Tm9kZUlkKGRhdGEubm9kZUlkKTtcbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUobnVsbCk7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZ2hsaWdodE5vZGUnLCB7XG4gICAgICAgIGhpZ2hsaWdodENvbmZpZzoge1xuICAgICAgICAgIGNvbnRlbnRDb2xvcjogSElHSExJR0hUX0NPTE9SLFxuICAgICAgICAgIHNob3dJbmZvOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG5vZGVJZDogZGF0YS5ub2RlSWRcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3N0b3AgaGlnaGxpZ2h0aW5nIGFmdGVyIGNvdXBsZSBvZiBzZWNvbmRzXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlkZUhpZ2hsaWdodCcpO1xuICAgICAgICB9LCBISUdITElHSFRfVElNRU9VVCk7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVJbnNwZWN0aW9uQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBTZWxlY3QgRE9NIG5vZGVzIHdpdGggXCJzZWxlY3QgeFwiIG9yIFwiaW5zcGVjdCB4XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSB0YWcsIGlkIG9yIENTUyBjbGFzcykuIElmIG11bHRpcGxlIG5vZGVzIG1hdGNoLCBvbmx5IHRoZSBmaXJzdCBvbmUgd2lsbCBiZSBzZWxlY3RlZC5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFJlZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC9yZWRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZWRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdSZWRvQ29tbWFuZCcpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVkbycpO1xuICB9XG59XG5cblJlZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlZG8gbGFzdCBjb21tYW5kIHdpdGggXCJyZWRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgUmVkb0NvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFVuZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC91bmRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICB1bmRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdVbmRvQ29tbWFuZCcpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00udW5kbycpO1xuICB9XG59XG5cblVuZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFVuZG8gbGFzdCBjb21tYW5kIHdpdGggXCJ1bmRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgVW5kb0NvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVRhYigpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlfSwgKHRhYnMpID0+IHtcbiAgICAgIGlmICh0YWJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZWplY3QoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHRhYnNbMF0pO1xuICAgIH0pXG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJjbGFzcyBJbmplY3RlZENvbnNvbGUge1xuICBjb25zdHJ1Y3Rvcih0YWJJZCkge1xuICAgIHRoaXMuX3RhYklkID0gdGFiSWQ7XG5cbiAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHRhYklkLCB7XG4gICAgICBmaWxlOiAnYm93ZXJfY29tcG9uZW50cy90cmFjZXVyLXJ1bnRpbWUvdHJhY2V1ci1ydW50aW1lLm1pbi5qcydcbiAgICB9LCAoKSA9PiB7XG4gICAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHRhYklkLCB7XG4gICAgICAgIGZpbGU6ICdkaXN0L2NvbnRlbnQtc2NyaXB0LmpzJ1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBsb2dNZXNzYWdlKHRleHQpIHtcbiAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0aGlzLl90YWJJZCwge1xuICAgICAgdHlwZTogJ2xvZycsXG4gICAgICBjb250ZW50OiB0ZXh0XG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRoaXMuX3RhYklkLCB7XG4gICAgICB0eXBlOiAnZGVzdHJveSdcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbmplY3RlZENvbnNvbGU7IiwiY29uc3QgSURMRSA9IDE7XG5jb25zdCBSRUNPUkRJTkcgPSAyO1xuXG5jbGFzcyBSZWNvcmRpbmdJY29uIHtcbiAgY29uc3RydWN0KCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IElETEU7XG4gICAgdGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwgPSBudWxsO1xuICB9XG5cbiAgc2hvdygpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBSRUNPUkRJTkc7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IGFuaW1hdGlvbiA9ICcgwrcnO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRnJhbWUoKSB7XG4gICAgICB2YXIgZnJhbWUgPSBhbmltYXRpb25baSAlIGFuaW1hdGlvbi5sZW5ndGhdO1xuICAgICAgaSsrO1xuXG4gICAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgICB0ZXh0OiBmcmFtZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlRnJhbWUoKTtcblxuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlRnJhbWUsIDE1MCk7XG4gIH1cblxuICBoaWRlKCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IElETEU7XG5cbiAgICBpZiAodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICB0ZXh0OiAnJ1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlY29yZGluZ0ljb247IiwiY2xhc3MgTGlzdGVuZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBub3RpZnlMaXN0ZW5lcnMoZGF0YSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihkYXRhKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0ZW5lck1hbmFnZXI7IiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuY29uc3QgQUNUSVZFID0gMTtcbmNvbnN0IElOQUNUSVZFID0gMjtcblxuY2xhc3MgU3BlZWNoUmVjb2duaXRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG5cbiAgICB0aGlzLm9uUmVzdWx0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICAgIHRoaXMub25FbmQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZWNvZ25pdGlvbi5jb250aW51b3VzID0gdHJ1ZTtcbiAgICAvL3JlY29nbml0aW9uLmludGVyaW1SZXN1bHRzID0gdHJ1ZTtcblxuICAgIHJlY29nbml0aW9uLm9uZW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5vbnJlc3VsdCA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IGludGVyaW1fdHJhbnNjcmlwdCA9ICcnLCBmaW5hbF90cmFuc2NyaXB0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGkgPSBldmVudC5yZXN1bHRJbmRleDsgaSA8IGV2ZW50LnJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGV2ZW50LnJlc3VsdHNbaV0uaXNGaW5hbCkge1xuICAgICAgICAgIGZpbmFsX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludGVyaW1fdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1NwZWVjaFJlY29nbml0aW9uJywgZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgICB0aGlzLm9uUmVzdWx0Lm5vdGlmeUxpc3RlbmVycyhmaW5hbF90cmFuc2NyaXB0KTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICAgIHRoaXMuX3JlY29nbml0aW9uID0gcmVjb2duaXRpb247XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gQUNUSVZFO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycyhldmVudC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gQUNUSVZFO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb2duaXRpb24pIHtcbiAgICAgIHRoaXMuX3JlY29nbml0aW9uLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3BlZWNoUmVjb2duaXRpb247XG4iLCJpbXBvcnQgTGlzdGVuZXJNYW5hZ2VyIGZyb20gJy4vbGlzdGVuZXItbWFuYWdlci5qcyc7XG5cbmZ1bmN0aW9uIF9hdHRhY2godGFiSWQpIHtcbiAgdmFyIHByb3RvY29sVmVyc2lvbiA9ICcxLjEnO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmF0dGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBwcm90b2NvbFZlcnNpb24sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfZGV0YWNoKHRhYklkKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmRldGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX3NlbmRDb21tYW5kKHRhYklkLCBjb21tYW5kLCBkYXRhID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuc2VuZENvbW1hbmQoe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgY29tbWFuZCwgZGF0YSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgIHJlamVjdChyZXNwb25zZS5lcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jbGFzcyBUYWJEZWJ1Z2dlciB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcbiAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG5cbiAgICBjaHJvbWUuZGVidWdnZXIub25EZXRhY2guYWRkTGlzdGVuZXIoKHNvdXJjZSwgcmVhc29uKSA9PiB7XG4gICAgICBpZihzb3VyY2UudGFiSWQgPT09IHRoaXMuX3RhYklkKSB7XG4gICAgICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25EaXNjb25uZWN0Lm5vdGlmeUxpc3RlbmVycygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICByZXR1cm4gX2F0dGFjaCh0aGlzLl90YWJJZCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0KCl7XG4gICAgcmV0dXJuIF9kZXRhY2godGhpcy5fdGFiSWQpO1xuICB9XG5cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoY29tbWFuZCwgZGF0YSkge1xuICAgIGlmKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhYkRlYnVnZ2VyOyIsImNsYXNzIFRleHRUb1NwZWVjaCB7XG4gIHNwZWFrKHRleHQpIHtcbiAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgIGVucXVldWU6IHRydWUsXG4gICAgICB2b2ljZU5hbWU6IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd2b2ljZU5hbWUnKS8vVE9ETyBkbyBub3QgcXVlcnkgbG9jYWxTdG9yYWdlIGV2ZXJ5IHRpbWVcbiAgICB9O1xuXG4gICAgY2hyb21lLnR0cy5zcGVhayh0ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUZXh0VG9TcGVlY2g7IiwiaW1wb3J0IFNwZWVjaFJlY29nbml0aW9uIGZyb20gJy4vbGliL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyc7XG5pbXBvcnQgQ29tbWFuZFJ1bm5lciBmcm9tICcuL2xpYi9jb21tYW5kLXJ1bm5lci5qcyc7XG5pbXBvcnQgVGFiRGVidWdnZXIgZnJvbSAnLi9saWIvdGFiLWRlYnVnZ2VyLmpzJztcbmltcG9ydCB7Z2V0QWN0aXZlVGFifSBmcm9tICcuL2xpYi9oZWxwZXJzL3RhYnMuanMnO1xuaW1wb3J0IFJlY29yZGluZ0ljb24gZnJvbSAnLi9saWIvcmVjb3JkaW5nLWljb24uanMnO1xuaW1wb3J0IFRleHRUb1NwZWVjaCBmcm9tICcuL2xpYi90ZXh0LXRvLXNwZWVjaC5qcyc7XG5pbXBvcnQgSW5qZWN0ZWRDb25zb2xlIGZyb20gJy4vbGliL2luamVjdGVkLWNvbnNvbGUuanMnO1xuXG5pbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IENTU0dldFZhbHVlQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9yZWRvLmpzJztcblxubGV0IHRleHRUb1NwZWVjaCA9IG5ldyBUZXh0VG9TcGVlY2goKTtcbmxldCByZWNvcmRpbmdJY29uID0gbmV3IFJlY29yZGluZ0ljb24oKTtcbmxldCBjb21tYW5kUnVubmVyID0gbmV3IENvbW1hbmRSdW5uZXIoKTtcblxuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZUluc3BlY3Rpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVEZWxldGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTQ2hhbmdlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NHZXRWYWx1ZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5sZXQgc3BlZWNoUmVjb2duaXRpb24gPSBuZXcgU3BlZWNoUmVjb2duaXRpb24oKTtcbmxldCB0YWJEZWJ1Z2dlciA9IG51bGw7XG5sZXQgaW5qZWN0ZWRDb25zb2xlID0gbnVsbDtcblxuc3BlZWNoUmVjb2duaXRpb24ub25SZXN1bHQuYWRkTGlzdGVuZXIoKHRyYW5zY3JpcHQpID0+IHtcbiAgaW5qZWN0ZWRDb25zb2xlLmxvZ01lc3NhZ2UoYCYjOTgzNDsgXCIke3RyYW5zY3JpcHR9XCJgKTtcblxuICBjb21tYW5kUnVubmVyLnJlY29nbml6ZSh0cmFuc2NyaXB0KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICBpZiAocmVzdWx0ICYmIHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpbmplY3RlZENvbnNvbGUubG9nTWVzc2FnZSgnJiMxMDE0NTsgJyArIHJlc3VsdCk7XG4gICAgICB0ZXh0VG9TcGVlY2guc3BlYWsocmVzdWx0KTtcbiAgICB9XG4gIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgaW5qZWN0ZWRDb25zb2xlLmxvZ01lc3NhZ2UoJyYjOTc2MjsgRXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlKTtcbiAgICAgIHRleHRUb1NwZWVjaC5zcGVhayhlcnJvci5tZXNzYWdlKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbnNwZWVjaFJlY29nbml0aW9uLm9uRW5kLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgaWYgKHRhYkRlYnVnZ2VyICYmIHRhYkRlYnVnZ2VyLmlzQ29ubmVjdGVkKCkpIHtcbiAgICB0YWJEZWJ1Z2dlci5kaXNjb25uZWN0KCk7XG4gIH1cbiAgcmVjb3JkaW5nSWNvbi5oaWRlKCk7XG4gIGlmKGluamVjdGVkQ29uc29sZSkge1xuICAgIGluamVjdGVkQ29uc29sZS5kZXN0cm95KCk7XG4gIH1cbn0pO1xuXG5jaHJvbWUuYnJvd3NlckFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBpZiAoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBzcGVlY2hSZWNvZ25pdGlvblxuICAgIC5zdGFydCgpXG4gICAgLnRoZW4oZ2V0QWN0aXZlVGFiKVxuICAgIC50aGVuKCh0YWIpID0+IHtcbiAgICAgIHRhYkRlYnVnZ2VyID0gbmV3IFRhYkRlYnVnZ2VyKHRhYi5pZCk7XG4gICAgICB0YWJEZWJ1Z2dlci5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgICBzcGVlY2hSZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgICB9KTtcblxuICAgICAgaW5qZWN0ZWRDb25zb2xlID0gbmV3IEluamVjdGVkQ29uc29sZSh0YWIuaWQpO1xuICAgICAgd2luZG93LmljID0gaW5qZWN0ZWRDb25zb2xlO1xuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuY29ubmVjdCgpO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmVjb3JkaW5nSWNvbi5zaG93KCk7XG4gICAgICBjb21tYW5kUnVubmVyLnNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciA9PSAnbm90LWFsbG93ZWQnKSB7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9wZW5PcHRpb25zUGFnZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgICAgICBzcGVlY2hSZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn0pOyJdfQ==
