# DevToolsVoiceCommands

Experimental extension that allows inspecting and modifying websites using voice commands.

![DevToolsVoiceCommands in action](https://i.imgur.com/h7J4j9v.gif)

## Installation

- download or clone this repository
- in Chrome go to the extensions page (`chrome://extensions/`)
- enable `Developer mode`
- click `Load unpacked extension` and navigate to the folder with extension files

## Available commands
- "inspect **x**" or "select **x**" (where **x** is node's tag name, ID or class name)
- "remove it" - removes last inspected element
- "get its **x**" (where **x** is name of the CSS property e.g. "font size")
- "change it to **y**" or "change **x** to **y**" (where **x** is name of CSS property and **y** is value)
- "undo" (reverts last action)

More details on extension's options page.

## About

This extension was not created to solve any specific issue but rather to play with [Chrome remote debugging protocol](https://chromedevtools.github.io/debugger-protocol-viewer/), [Speech](http://updates.html5rocks.com/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API) and [TTS](https://developer.chrome.com/apps/tts) APIs. It's all pure fun, but if you find it useful please let me know, I'll be glad to help.

## Contributing

Project is written in ES6 and transpiled to ES5 using traceur. To start developing:

- fork this repository
- clone it localy
- in the project's folder run `npm install` 
- run `gulp` to start the file watcher

## Author

**Konrad Dzwinel**

+ https://twitter.com/kdzwinel
+ https://github.com/kdzwinel
+ http://www.linkedin.com/pub/konrad-dzwinel/53/599/366/en
