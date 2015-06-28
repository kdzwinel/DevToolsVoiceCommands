import ListenerManager from './listener-manager.js';
const ACTIVE = 1;
const INACTIVE = 2;

class SpeechRecognition {
  constructor() {
    this._recognition = null;
    this._status = INACTIVE;

    this.onResult = new ListenerManager();
    this.onEnd = new ListenerManager();
  }

  start() {
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    //recognition.interimResults = true;

    recognition.onend = () => {
      this._status = INACTIVE;
      this.onEnd.notifyListeners();
    };

    recognition.onresult = (event) => {
      let interim_transcript = '', final_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      console.log('SpeechRecognition', final_transcript);
      this.onResult.notifyListeners(final_transcript);
    };

    recognition.start();

    this._recognition = recognition;

    return new Promise((resolve, reject) => {
      recognition.onstart = () => {
        this._status = ACTIVE;
        resolve();
      };

      recognition.onerror = (event) => {
        this._status = INACTIVE;
        this.onEnd.notifyListeners(event.error);
        reject(event.error);
      };
    });
  }

  isActive() {
    return this._status === ACTIVE;
  }

  stop() {
    if (this._recognition) {
      this._recognition.stop();
    }
  }
}

export default SpeechRecognition;
