module.exports = (function (_, Q, spawn, task, Common) {
  'use strict';

  return _.extend(_.create(task), {
    fn: function coreRunSequence() {
      var args = Array.prototype.splice.call(arguments, 0);

      var flow = _.first(args);
      var tasks = _.drop(args); // drop first element (flow)

      return Common.runSequence(tasks, flow);
    }
  });
})(require('lodash'), require('q'), require('child_process').spawn, rootRequire('services/Core/task'), libRequire('Common'));
