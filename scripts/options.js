let recognition = new webkitSpeechRecognition();
let errorNode = document.querySelector('.error');
let askNode = document.querySelector('.ask');
let successNode = document.querySelector('.success');

recognition.onstart = () => {
  askNode.hidden = true;
  successNode.hidden = false;

  recognition.stop();
};
recognition.onerror = (event) => {
  errorNode.innerText = "Ups! Something went wrong, we got this error back: " + event.error;
};

recognition.start();