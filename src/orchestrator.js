
const logger = require('./utils/logger');
const Chrome = require('./chrome');

const CDP = require('chrome-remote-interface');
/**
 * Orchestrate command line tools with ./index.js
 */

class Orchestrator {
  constructor({ parsers = {} }) {
    const l = 1;
    this.amazon = parsers.amazon;
    this.chrome = new Chrome({
      headless: true,
    });
  }

  run() {
    return this.chrome.then(async chrome => {
      logger.log(`Chrome debuggable on port: ${chrome.port}`);
      const version = await CDP.Version({ port: chrome.port });
      logger.log(version['User-Agent']);
      chrome.kill();
    });

  }
}

module.exports = Orchestrator;
