var _ = require('lodash');
var Q = require('q');
var promptFactory = require('../shell/prompt');
var noOpFactory = require('./noOp');

function LinkDependencies(starflow) {
  this.starflow = starflow;
}

LinkDependencies.prototype.promptDependencies = function promptDependencies() {
  var starflow = this.starflow;
  if (!_.get(starflow.flow, 'prompt.teadsDependencies.properties.list')) {
    _.set(starflow.flow, 'prompt.teadsDependencies.properties', {
      list: {
        description: 'Dependencies list (blank space separated)',
        message: 'e.g. teads-player teads-player/lib-format-vpaid-ui',
        required: true
      }
    });
  }
  var taskConfig = {args: ['teadsDependencies']};
  return starflow.wrapTask(promptFactory, taskConfig)();
};

LinkDependencies.prototype.exec = function (dependencyChainSeparator) {
  var starflow = this.starflow;
  dependencyChainSeparator = dependencyChainSeparator || '/';

  return this.promptDependencies()
    .then(function () {
      var deps = [];
      var dependencies = _.get(starflow.flow, 'prompt.teadsDependencies.result.list');
      dependencies = dependencies ? dependencies.split(' ') : [];
      _.forEach(dependencies, function (dep) {
        // e.g. dep==="service-format-player", dep==="service-format-player/lib-format-vpaid-ui"
        var depChain = dep.split(dependencyChainSeparator);
        var cdPath = './node_modules/';
        _.forEach(depChain, function (pathDep, index) {
          // e.g. pathDep==="a" then pathDep==="b" for dep==="a/b"
          cdPath += pathDep + ((index === depChain.length - 1) ? '' : '/node_modules/');
        });

        deps.push({
          name: dep,
          chain: depChain,
          branch: starflow.flow.teads.branchName,
          path: cdPath
        });
      });

      return starflow.flow;
      // TODO
      // return deps;
    });
    // .then(function (deps) {
    //   var sequences = [];
    //   _.forEach(deps, function (dep) {
    //     sequences.push([
    //       starflow.wrapTask(noOpFactory, {description: 'npm link ' + dep.name, args:[]}),
    //       starflow.wrapTask(noOpFactory, {description: 'cd ' + dep.path, args:[]}),
    //       starflow.wrapTask(noOpFactory, {description: 'git co master && git fetch && git rebase origin/master master && git co -b ' + dep.branch, args:[]}),
    //       starflow.wrapTask(noOpFactory, {description: 'cd ' + _.times(dep.chain.length, function () { return '..'; }).join('/'), args:[]})
    //     ]);
    //   });
    //   return starflow.runSequences(sequences);
    // });
};

module.exports = function linkDependenciesFactory(starflow) {
  return new LinkDependencies(starflow);
};
