var _ = require('lodash');

function TeadsService() {

}

TeadsService._instance = null;

TeadsService.getInstance = function () {
  if (!TeadsService._instance) {
    TeadsService._instance = new TeadsService();
  }
  return TeadsService._instance;
};

TeadsService.prototype.parseDependency = function (dependencyPath) {
  var dependencyChainSeparator = '/';
  // e.g. dep === "teads-player", dep === "teads-player/teads-vpaid-ui"
  var chain, baseBranch;
  var matches = dependencyPath.match(/(.+):(.+)/); // e.g. "teads-player:release/v1"
  if (matches) {
    chain = matches[1].split(dependencyChainSeparator);
    baseBranch = matches[2] || 'master';
  } else {
    chain = dependencyPath.split(dependencyChainSeparator);
    baseBranch = 'master';
  }
  return {
    fullName: dependencyPath,
    name: _.last(chain),
    chain: chain,
    baseBranch: baseBranch
  };
};

TeadsService.prototype.generatePath = function (dependency) {
  var path = require('path');
  var pathName = _.reduce(dependency.chain, function (prev, current) {
    return prev + 'node_modules/' + current + '/';
  }, './');
  return path.resolve(pathName);
};

TeadsService.prototype = Object.create(null);

module.exports = TeadsService;
