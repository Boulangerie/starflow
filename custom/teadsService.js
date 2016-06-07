var _ = require('lodash');

function parseDependency(dependencyPath) {
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
}

function generatePath(dependency) {
  var path = require('path');
  var pathName = _.reduce(dependency.chain, function (prev, current) {
    return prev + 'node_modules/' + current + '/';
  }, './');
  return path.resolve(pathName);
}

module.exports = {
  parseDependency: parseDependency,
  generatePath: generatePath
};
