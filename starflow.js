global.libRequire = function libRequire(name) {
  return require(__dirname + '/lib/' + name);
};

global.rootRequire = function rootRequire(name) {
  return require(__dirname + '/' + name);
};

module.exports = (function (_, Q, fs, chalk, Common, Logger) {
  'use strict';

  libRequire('utils');

  Q.longStackSupport = true;

  var _mapTaskCallback = {};
  var _tasks = [];
  var _flow = {};
  var _execContext;

  function _initMaps(userMap) {
    try {
      var starflowMap = fs.readFileSync(__dirname + '/lib/mapTaskCallback.json', 'utf-8');
      starflowMap = JSON.parse(starflowMap);
    } catch (err) {
      throw err;
    }

    _.forEach(starflowMap, function (filepath, key) {
      starflowMap[key] = __dirname + '/' + filepath;
    });

    _.forEach(userMap, function (filepath, key) {
      userMap[key] = _execContext + '/' + filepath;
    });

    _mapTaskCallback = _.extend(starflowMap, userMap);
  }

  function init(tasks, execContext, flow, userMap) {
    if (_.isUndefinedOrNull(flow)) {
      flow = {};
    }

    if (_.isUndefinedOrNull(execContext)) {
      throw new Error('You must set the execution context (usually __dirname) for starflow.init');
    }

    _execContext = execContext;
    _tasks = tasks;
    _flow = flow;
    _initMaps(userMap);
    Common.init(_mapTaskCallback);
    return this;
  }

  function run(withEndMessage) {
    withEndMessage = _.isUndefined(withEndMessage) ? true : withEndMessage;
    var promise = Common.runSequence(_tasks, _flow);

    if (withEndMessage) {
      promise
        .then(function (res) {
          console.log(chalk.black.bgGreen('\n SUCCESS ') + chalk.green(' Sequence finished successfully'));
          return res;
        })
        .fail(function (err) {
          //console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' Sequence aborted due to errors: ' + err.message));
          console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' ' + err.message));
          throw err;
        })
        .done();
    }

    return promise;
  }

  return {
    init: init,
    run: run
  };

})(require('lodash'), require('q'), require('fs'), require('chalk'), libRequire('Common'), libRequire('Logger'));
