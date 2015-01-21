module.exports = function (grunt) {
  'use strinct';

  grunt.registerMultiTask('tdw', 'Teads Dev Workflow', function () {

    var config = this.options();
    var done = this.async();

    config.jira = config.jira || {};
    config.gitlab = config.gitlab || {};

    config.jira.user = config.jira.user || process.env.JIRA_USERNAME;
    config.jira.pass = config.jira.pass || process.env.JIRA_PASSWORD;
    config.gitlab.token = config.gitlab.token || process.env.GITLAB_TOKEN;

    config.jira.issueNum = this.args[0];
    config.jira.issueSlug = this.args[1];
    config.jira.projectKey = config.jira.projectKey || 'MAN';

    config.steps = this.data;

    var tdw = require('./libs/tdw');

    tdw
      .init(config)
      .run()
      .then(function (res) {
        done();
      }, function (err) {
        grunt.fatal(err);
        done(false);
      })
      .done();
  });
};