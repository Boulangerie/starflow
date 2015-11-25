module.exports = (function (_, Q, spawn, chalk, task, Logger) {
  'use strict';

  return _.extend(_.create(task), {
    logHeader: function logHeader(args) {
      var cmd = args[1];
      var cmdArgs = args[2] || [];
      return '$ ' + cmd + ' ' + cmdArgs.join(' ');
    },

    fn: function shellSpawn(flow, cmd, args, withLog, stdin, muteErrors, options) {
      var deferred = Q.defer();
      var self = this;

      withLog = _.isUndefined(withLog) ? true : withLog;
      muteErrors = !!muteErrors;
      var data = _.isUndefinedOrNull(stdin) ? flow.lastShellOutput : stdin;

      var stdout = [];
      var stderr = [];
      var s = spawn(cmd, args, _.extend({ stdio: 'pipe' }, options));
      s.stdout.setEncoding('utf8');
      s.stderr.setEncoding('utf8');

      _.forEach(data, function (d) {
        s.stdin.write(d.toString());
      });
      s.stdin.end();

      s.stdout.on('data', function(data){
        stdout.push(data);
      });

      s.stderr.on('data', function(data){
        stderr.push(data);
      });

      s.on('close', function (code) {
        if (code === 0 || muteErrors) {
          if (withLog) {
            Logger.log(String(stdout));
          }
          if (code !== 0) {
            self.logSuccess = function () {
              return chalk.yellow('(errors detected but muted by task config)');
            };
          }
          deferred.resolve(_.merge(flow, {
            lastShellOutput: stdout
          }));
        } else {
          deferred.reject(stderr);
        }
      });

      return deferred.promise;
    }
  });
})(require('lodash'), require('q'), require('child_process').spawn, require('chalk'), rootRequire('services/Core/task'), libRequire('Logger'));
