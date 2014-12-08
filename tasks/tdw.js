module.exports = function (grunt) {
  'use strinct';

  grunt.registerMultiTask('tdw', 'Teads Dev Workflow', function () {

    // Magic!
    var config = this.options();
    var issueNum = this.args[0];
    var issueDesc = this.args[1];
    var done = this.async();

    config.steps = this.data;

    // put credentials in config object
    config.jira.user = process.env.JIRA_USERNAME;
    config.jira.pass = process.env.JIRA_PASSWORD;
    config.gitlab.token = process.env.GITLAB_TOKEN;

    config.jira.issueNum = issueNum;
    config.jira.issueKey = config.jira.projectKey + '-' + config.jira.issueNum;
    config.jira.issueDesc = issueDesc;

    // Expose some variables to grunt config
    // grunt.config('tdw_issueType', 'wut'); // set later when we have found the issue from Jira
    // grunt.config('tdw_issueKey', (config.jira.projectKey + '-' + issueNum) || null);
    // grunt.config('tdw_issueDesc', issueDesc || '');

    var tdw = require('./libs/tdw').init(config);

    tdw
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