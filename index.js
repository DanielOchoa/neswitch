#!/usr/bin/env node

const program = require('commander');
const Orchestrator = require('./src/orchestrator');

// parser of opts
const optsParse = opts => {
  try {
    return JSON.parse(opts);
  } catch(e) {
    console.log('[neswitch]: Passed options are invalid...');
    console.log('[neswitch]: Error: ', e);
    process.exit(1);
  }
}

program
  .version('0.1.0')
  .option('-a, --amazon <options>', 'Amazon scraper', optsParse)
  .parse(process.argv);


const orchestrator = new Orchestrator({
  parsers: {
    amazon: program.amazon,
  },
});

orchestrator.run();
