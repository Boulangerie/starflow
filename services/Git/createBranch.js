module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitCreateBranch(flow, branchName) {
      var task = {
        name: 'shell',
        args: ['git', ['branch', branchName], {}, false]
      };
      return Common.taskWrapper(task, flow)()
        .then(function (res) {
          Logger.log('Created branch: ' + branchName, 'green');
          return Q(_.merge(flow, {
            git: {
              lastBranchCreated: branchName
            }
          }));
        }, function (err) {
          if (!/already exists/.test(err.message)) {
            throw err;
          }
          // branchName = err.message.match(/A branch named \'(.+)\' already exists/)[1];
          Logger.log('The branch "' + branchName + '" could not be created because it already exists', 'yellow');
          return Q(_.merge(flow, {
            git: {
              lastBranchCreated: branchName
            }
          }));
        });
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));
