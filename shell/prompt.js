var _ = require('lodash');
var Q = require('q');
var prompt = require('prompt');
var chalk = require('chalk');

function Prompt(starflow) {
  this.starflow = starflow;
}

Prompt.prototype.exec = function (schemaName) {
  var starflow = this.starflow;
  var deferred = Q.defer();

  prompt.message = chalk.gray(starflow.logger.getPaddingText()) + ' ?';
  prompt.delimiter = ' ';

  prompt.start();

  var schema = _.get(starflow.flow, 'prompt.' + schemaName);
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
    _.set(starflow.flow, 'prompt.' + schemaName + '.result', result);
    deferred.resolve(starflow.flow);
  });

  return deferred.promise;
};

module.exports = function promptFactory(starflow) {
  return new Prompt(starflow);
};
