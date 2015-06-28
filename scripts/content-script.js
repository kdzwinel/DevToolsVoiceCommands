class ConsoleUI {
  constructor() {
    let rootNode = document.createElement('div');
    rootNode.setAttribute('style', `
    position:fixed;
    left: 0;
    bottom: 0;
    width:100%;
    margin: 0;
    padding: 0;
    z-index: 10000;
    `);

    let shadowRoot = rootNode.createShadowRoot();

    shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        .wrapper {
          width: 100%;
          padding: 8px;
          height: 75px;
          background: rgba(255,255,255,0.85);
          box-shadow: black 0 0 10px 0px;

          color: #5B5B5C;
          font-size: 14px;

          background-size: 40px 40px;
          background-position: left center;
          background-repeat: no-repeat;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAB3RJTUUH3wYaARwIdjb5WQAAAgVJREFUeNrt3WtSwkAQhdEMxS5xebJOXYFVAnn07T7ntyUh882EPNBtAwAAAAAAAAC6WVPe6OPx9fPKzz+f30sAAwd+WgjLwM8OYRn82REsgz87gmXwZ0ewDP7sCG7OhF0HMPsHrwJWACuA2T95FbACDCcAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAARATfezXui/f82r+59nr7YfrAAOAQggcInsvPxbAegXwJR/wpS2r2521uyoHQIcAvI/LF0xE199zaofbq0Aw63Ks7vqLDtyu85ezVqtAGfsvG5nM6UDeGdGHzlA7/zu6he2bmbp7NVlJczsT3bMlf88OuFs5rLj2dk7p/vrveu+DeFSdLEVIGmWdH5fUaeBCbeK025nr8QdVnUlSHwvK3nWVAkhefujrwRWWG7Tn2BaHQbzqpmUuM1lA9hjNp21U1O2My6AvZbUo3Zw5W1rE8Dex9Wzr+ilnb2UvbBy5IervwbiitcUQONP2NUHv3wAHSKofvk65gZJWggp9y2i7pClRJB05zHyFmnVEBJvOUffI68SQvKzBi0ekrgqhA4PmbR6Sqbq9wIE0CCGro+UjXlOruvjZ5/y3cDhBCAABIAAEAACQAAIAAEgAASAABAAAkAACAAAAAAAgES/2tfqXit7Na8AAAAASUVORK5CYII=');
        }

        ul {
          margin: 0;
          width: 100%;
          list-style-type: none;
        }
      </style>
      <div class='wrapper'>
        <ul>
          <li>Waiting for commands.</li>
        </ul>
      </div>
    `;

    document.body.appendChild(rootNode);
    rootNode.animate([{transform: 'translate(0, 120%)'}, {transform: 'translate(0, 0)'}], 300);

    this._shadowRoot = shadowRoot;
    this._rootNode = rootNode;
  }

  log(text) {
    let logs = this._shadowRoot.querySelector('ul');
    let li = document.createElement('li');

    li.innerHTML = text;
    logs.insertBefore(li, logs.firstElementChild);
  }

  destroy() {
    let player = (this._rootNode).animate([{transform: 'translate(0, 0)'}, {transform: 'translate(0, 120%)'}], 300);
    player.onfinish = () => {
      document.body.removeChild(this._rootNode);
    };
  }
}

let consoleUI = new ConsoleUI();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'destroy') {
    consoleUI.destroy();
  } else if (message.type === 'log') {
    consoleUI.log(message.content);
  }
});