var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');
var Task = require('../Task');
var promptFactory = require('../shell/prompt');
var noOpFactory = require('./noOp');

function LinkDependencies() {

}

LinkDependencies.prototype.promptDependencies = function promptDependencies() {
  if (!_.get(starflow.config, 'prompt.teadsDependencies.properties.list')) {
    _.set(starflow.config, 'prompt.teadsDependencies.properties', {
      list: {
        description: 'Dependencies list (blank space separated)',
        message: 'e.g. teads-player teads-player/lib-format-vpaid-ui',
        required: true
      }
    });
  }
  return new Task(promptFactory(), ['teadsDependencies'])
    .run()
};

LinkDependencies.prototype.exec = function (dependencyChainSeparator) {
  dependencyChainSeparator = dependencyChainSeparator || '/';

  return this.promptDependencies()
    .then(function () {
      var deps = [];
      var dependencies = _.get(starflow.config, 'prompt.teadsDependencies.result.list');
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
          branch: starflow.config.teads.branchName,
          path: cdPath
        });
      });
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

module.exports = function () {
  return new LinkDependencies();
};
