class TextToSpeech {
  speak(text) {
    let options = {
      enqueue: true,
      voiceName: localStorage.getItem('voiceName')//TODO do not query localStorage every time
    };

    chrome.tts.speak(text, options);
  }
}

export default TextToSpeech;