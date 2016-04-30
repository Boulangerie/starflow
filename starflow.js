var Logger = require('./Logger');

module.exports = {
  logger: new Logger(),
  Workflow: require('./Workflow'),
  Task: require('./Task'),
  Sequence: require('./Sequence'),
  Concurrency: require('./Concurrency'),
  Executable: require('./Executable'),
  Storage: require('./Storage')
};
