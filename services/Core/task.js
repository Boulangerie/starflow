module.exports = (function (_, Q, chalk, Logger, Common) {
  'use strict';

  return {
    name: 'Generic task',

    logHeader: function logHeader(args) {
      var flow = args[0];
      args.shift();
      var argsStr = Logger.logArgsStr(args);
      args.unshift(flow);
      return this.name + ' ' + argsStr;
    },

    logSuccess: function logSuccess(res) {
      return '';
    },

    logError: function logError(err) {
      return '';
    },

    getDependencies: function getDependencies(flow) {
      return [];
    },

    exec: function exec(args, previousDependencies, withLogs, requiredBy) {
      withLogs = _.isUndefined(withLogs) ? true : withLogs;
      var self = this;

      previousDependencies.push(this.name);

      var numberOfSelfTasks = previousDependencies.filter(function (cmdName) {
        return cmdName === self.name;
      }).length;
      if (numberOfSelfTasks > 1) {
        Logger.log('Cyclic dependency found: ' + previousDependencies.join(' -> '), 'red');
        throw new Error('Cyclic dependency found while executing "' + self.name + '"');
      }

      var dependencies = this.getDependencies.apply(this.getDependencies, args);
      return Common
        .runSequence(dependencies, args[0], previousDependencies, self.logHeader(args))
        .then(function (res) {
          args[0] = res;
          if (!withLogs) {
            Logger.disable();
          }

          var requiredByMsg = _.isString(requiredBy) ? chalk.magenta(' [' + chalk.underline('autoloaded by') + ': ' + requiredBy + ']') : '';

          Logger.header(self.logHeader(args) + requiredByMsg);
          Logger.depth++;

          return self.fn.apply(self, args);
        })
        .then(function (res) {
          Logger.depth--;
          Logger.success(self.logSuccess(res));
          return res;
        }, function (err) {
          Logger.depth--;
          Logger.error(self.logError(err));
          throw err;
        })
        .finally(function () {
          // remove self from dependencies chain
          previousDependencies.splice(previousDependencies.indexOf(self.name), 1);
          Logger.enable();
        });
    },

    fn: function (flow) {
      return Q(flow);
    }
  };
})(require('lodash'), require('q'), require('chalk'), libRequire('Logger'), libRequire('Common'));
