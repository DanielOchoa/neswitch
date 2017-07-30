#!/usr/bin/env node

// https://www.npmjs.com/package/app-module-path
require('app-module-path').addPath(`${__dirname}/src`);

const program = require('commander');
const Orchestrator = require('orchestrator');
const logger = require('utils/logger');

// parser of opts
const optsParse = opts => {
  try {
    return JSON.parse(opts);
  } catch(e) {
    logger.log('Passed options are invalid...');
    logger.log('Error:', e);
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
