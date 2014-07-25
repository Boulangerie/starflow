module.exports = function (grunt) {

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ttdev: {
      options: {
        gitlab: {
          host: 'https://git.teads.tv',
          project: 'SERVICE Manager' // id: 4
        },
        jira: {
          host: 'https://jira.teads.tv',
          project: 10300 // name: Manager
        }
      },
      test: {
        steps: [
          'gitlab.check.connection',
          'jira.check.connection',
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } }
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
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'gitlab.assign.merge_request': { assignee: 'bruiz' } },
          { 'jira.move.card': { status: 'Reviews' } }
        ]
      }
    }

  });

  grunt.registerTask('new_feat', ['ttdev:create:feat']);
  grunt.registerTask('end_feat', ['ttdev:finish:feat']);
  grunt.registerTask('new_fix', ['ttdev:create:fix']);
  grunt.registerTask('end_fix', ['ttdev:finish:fix']);

};