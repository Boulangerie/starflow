var Logger = require('./Logger');
var Config = require('./Config');

module.exports = {
  logger: new Logger(),
  config: new Config(),
  Workflow: require('./Workflow'),
  Task: require('./Task'),
  Sequence: require('./Sequence'),
  Concurrency: require('./Concurrency'),
  BaseExecutable: require('./BaseExecutable'),
  Storage: require('./Storage')
};
