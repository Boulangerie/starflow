module.exports = (function (_, Q, Logger, Common, BaseTask) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitGetCurrentBranch(flow) {
      var task = {
        name: 'shell',
        args: ['git', ['branch'], {}, false]
      };
      return Common.taskWrapper(task, flow)()
        .then(function (res) {
          var branchLines = res.lastShellOutput[0].split('\n');
          var branchName = '';
          _.forEach(branchLines, function (line) {
            if (line.match(/^\*\s([a-zA-Z0-9_-]+)/m)) {
              branchName = line.match(/^\*\s([a-zA-Z0-9_-]+)/m)[0].replace('* ', '');
              return false;
            }
          });

          Logger.log('Current branch: ' + branchName);
          return Q(_.merge(flow, {
            git: {
              currentBranch: branchName
            }
          }));
        });
    },

    requires: []
  });
})(require('lodash'), require('q'), libRequire('Logger'), libRequire('Common'), rootRequire('services/Core/task'));