const chalk = require('chalk');
const appName = require('../../package.json')['name'];
const prefix = `[${appName}]:`;

/**
 * Logs with `neswitch` prefix.
 */
class Logger {
  constructor({ logColor, errorColor, prefix }) {
    this.prefix = prefix;
    this.logColor = logColor;
    this.errorColor = errorColor;
  }

  log() {
    console.log(`${chalk[this.logColor](prefix)}`, ...arguments);
  }
}

module.exports = new Logger({ logColor: 'blue', errorColor: 'red', prefix });
