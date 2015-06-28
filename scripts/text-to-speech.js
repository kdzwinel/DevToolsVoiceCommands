class TextToSpeech {
  speak(text) {
    let options = {
      enqueue: true
    };

    if(localStorage.voiceName) {
      options.voiceName = localStorage.voiceName;
    }

    chrome.tts.speak(text, options);
  }
}

export default TextToSpeech;