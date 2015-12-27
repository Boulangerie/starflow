var _ = require('lodash');
var Promise = require("bluebird");
var prompt = require('prompt');
var chalk = require('chalk');
var starflow = require('../starflow');

function Prompt() {}

Prompt.prototype.exec = function (schemaName) {
  return new Promise(function(resolve, reject){
    prompt.message = chalk.gray(starflow.logger.getPaddingText()) + ' ?';
    prompt.delimiter = ' ';

    prompt.start();

    var schema = _.get(starflow.config, 'prompt.' + schemaName);
    if (!schema) {
      reject(new Error('Schema "' + schemaName + '" form prompt not found'));
    }

    //@todo: Do something better with bluebird here
    prompt.get(schema, function (err, result) {
      if (err) {
        reject(err);
      }
      _.set(starflow.config, 'prompt.' + schemaName + '.result', result);
      resolve();
    });
  });
};

module.exports = function () {
  return new Prompt();
};
