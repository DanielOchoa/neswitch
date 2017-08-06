#!/usr/bin/env node

const program = require('commander');
const Orchestrator = require('./build/orchestrator.bundle');
const logger = require('./src/utils/logger');

/*
 * Option parser for program
 */
const optsParse = opts => {
  try {
    return JSON.parse(opts);
  } catch(e) {
    logger.log('Passed options are invalid...');
    logger.log('Error:', e);
    process.exit(1);
  }
}

/**
 * Program
 */
program
  .version('0.1.0')
  .option('-a, --amazon <options>', 'Amazon scraper', optsParse)
  .parse(process.argv);


const orchestrator = new Orchestrator({
  parsers: {
    amazon: program.amazon,
  },
});

/**
 * Exec
 */
orchestrator.run();
