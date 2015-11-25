module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  var pattern = '^git';

  return _.extend(_.create(BaseTask), {
    fn: function linkGitDependencies(flow) {

      var depPromise;
      if (_.result(flow, 'npm.dependencies')) {
        depPromise = Q(flow);
      } else {
        var task = {
          name: 'npm.extractDependencies',
          args: []
        };
        depPromise = Common.taskWrapper(task, flow)();
      }

      return depPromise
        .then(function (flow) {

          var regex = new RegExp(pattern);

          var dependencies = _.pick(flow.npm.dependencies, function (version) {
            return regex.test(version);
          });

          var sequence = [];
          _.forEach(dependencies, function (v, depName) {
            sequence.push({ 'shell': ['npm', ['link', depName], false] });
          });

          return Common.runSequence(sequence, flow)
            .then(function (res) {
              Logger.log('Dependencies linked successfully');
              return Q(res);
            });
        });
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));