var _ = require('lodash');
var Q = require('q');
var spawn = require('child_process').spawn;

function Spawn(starflow) {
  this.starflow = starflow;
}

Spawn.prototype.exec = function exec(cmd, args, muteErrors, options) {
  var starflow = this.starflow;
  var deferred = Q.defer();

  var stdout = [];
  var stderr = [];
  var s = spawn(cmd, args, _.extend({ stdio: 'pipe' }, options));
  s.stdout.setEncoding('utf8');
  s.stderr.setEncoding('utf8');

  // var data = _.isUndefinedOrNull(stdin) ? starflow.flow.lastShellOutput : stdin;
  // _.forEach(data, function (d) {
  //   s.stdin.write(d.toString());
  // });
  // s.stdin.end();

  s.stdout.on('data', function (data) {
    stdout.push(data);
  });

  s.stderr.on('data', function (data) {
    stderr.push(data);
  });

  s.once('error', function (err) {
    starflow.logger.error('Are you sure "' + cmd + '" is a valid command?');
    deferred.reject(err);
  });

  s.on('close', function (code) {
    if (code === 0 || muteErrors) {
      if (starflow.logger.level > starflow.logger.__proto__.LEVEL.NORMAL) {
        var messages = String(stdout).split('\n');
        _.forEach(messages, function (message) {
          if (message) {
            starflow.logger.log(message);
          }
        });
      } else {
        starflow.logger.warning('STDOUT muted (set starflow.logger.level property to starflow.logger.__proto__.LEVEL.ALL to see these logs)');
      }
      if (code !== 0) {
        starflow.logger.warning('Errors detected but muted by the task parameters');
      }
      _.set(starflow.flow, 'lastShellOutput', stdout);
      deferred.resolve(starflow.flow);
    } else {
      deferred.reject(new Error(stderr));
    }
  });

  return deferred.promise;
};

module.exports = function spawnFactory(starflow) {
  return new Spawn(starflow);
};
