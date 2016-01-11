var _ = require('lodash');

function parseDependencies(dependencies) {
  var dependencyChainSeparator = '/';
  return _.map(dependencies, function (dep) {
    // e.g. dep === "teads-player", dep === "teads-player/teads-vpaid-ui"
    var chain, baseBranch;
    var matches = dep.match(/(.+):(.+)/); // e.g. "teads-player:release/v1"
    if (matches) {
      chain = matches[1].split(dependencyChainSeparator);
      baseBranch = matches[2] || 'master';
    } else {
      chain = dep.split(dependencyChainSeparator);
      baseBranch = 'master';
    }
    return {
      fullName: dep,
      name: _.last(chain),
      chain: chain,
      baseBranch: baseBranch
    };
  });
}

var helpers = {
  parseDependencies: parseDependencies
};

module.exports = function (api) {
  return {
    buildBranchName: require('./buildBranchName'),
    createPullRequests: require('./createPullRequests')(helpers, api),
    linkDependencies: require('./linkDependencies')(helpers),
    unlinkDependencies: require('./unlinkDependencies')(helpers),
    checkoutDependencies: require('./checkoutDependencies')(helpers),
    noOp: require('./noOp')
  };
};
