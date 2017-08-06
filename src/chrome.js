const chromeLauncher = require('chrome-launcher');
const logger = require('./utils/logger');
/**
 * Abstraction built on top of chrome-launcher to interact with chrome.
 */

class Chrome {
  constructor(options) {
    this.options = Object.assign({
      port: 3001,
      chromeFlags: [
        '--window-size=412,732',
        '--disable-gpu',
        options.headless ? '--headless' : ''
      ]
    }, options);
    return this._launchChrome();
  }

  _launchChrome() {
    return chromeLauncher.launch(this.options);
  }
}

module.exports = Chrome;
