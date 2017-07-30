/**
 * Orchestrate command line tools with ./index.js
 */

class Orchestrator {
  constructor({ parsers = {} }) {
    this.amazon = parsers.amazon;
  }

  run() {
    console.log(this.amazon);
  }
}

module.exports = Orchestrator;
