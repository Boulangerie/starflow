var _ = require('lodash');
var prompt = require('prompt');
var chalk = require('chalk');
var starflow = require('../starflow');

function Prompt() {}

Prompt.prototype.exec = function (schemaName) {
  var deferred = new Promise();

  prompt.message = chalk.gray(starflow.logger.getPaddingText()) + ' ?';
  prompt.delimiter = ' ';

  prompt.start();

  var schema = _.get(starflow.config, 'prompt.' + schemaName);
  if (!schema) {
    deferred.reject(new Error('Schema "' + schemaName + '" form prompt not found'));
    return;
  }

  prompt.get(schema, function (err, result) {
    if (err) {
      console.log('');
      deferred.reject(err);
      return;
    }
    _.set(starflow.config, 'prompt.' + schemaName + '.result', result);
    deferred.resolve();
  });

  return deferred.promise;
};

module.exports = function () {
  return new Prompt();
};
