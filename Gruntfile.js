module.exports = function (grunt) {

  grunt.loadTasks('tasks');
  
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ttdev: {
      options: {
        gitlab: {
          host: 'https://git.teads.tv',
          project: 'manager',
          managerId: 226
        },
        jira: {
          host: 'https://jira.teads.tv',
          project: 'manager_test',
          managerId: 10605
        }
      },
      test: {
        steps: [
          'gitlab.check.connection',
          'jira.check.connection',
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'git.checkout': { branch: 'master' } }
        ]
      },
      create: {
        steps: [
          'gitlab.check.connection',
          'jira.check.connection',
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'git.checkout': { branch: 'master' } },
          { 'git.pull': { with_rebase: true } },
          { 'git.create.branch': { with_checkout: true } },
          'git.push',
          { 'gitlab.create.merge_request': { ref_branch: 'master' } },
          { 'jira.move.card': { status: 'In Progress' } }
        ]
      },
      finish: {
        steps: [
          'gitlab.check.connection',
          'jira.check.connection',
          'jira.check.card',
          { 'gitlab.assign.merge_request': { assignee: 'bruiz' } },
          { 'jira.move.card': { status: 'Reviews' } }
        ]
      }
    }

  });

  grunt.registerTask('create_feat', ['ttdev:create:feat']);

};