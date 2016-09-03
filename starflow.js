var Logger = require('./lib/core/Logger');
var Config = require('./lib/core/Config');

module.exports = {
  logger: new Logger(),
  config: new Config(),
  plugin: function (starflow) {
    return {
      factories: {
        forEach: require('./lib/utils/forEach')(starflow),
        concurrent: require('./lib/utils/concurrent')(starflow)
      }
    }
  },
  Workflow: require('./lib/core/Workflow'),
  Task: require('./lib/core/Task'),
  Sequence: require('./lib/core/Sequence'),
  Concurrency: require('./lib/core/Concurrency'),
  BaseExecutable: require('./lib/core/BaseExecutable'),
  Storage: require('./lib/core/Storage')
};
