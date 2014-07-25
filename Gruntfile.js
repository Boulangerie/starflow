module.exports = function (grunt) {

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ttdev: {
      options: {
        credentials_file: __dirname + '/tasks/credentials.js',
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
          { 'jira.move.card': { status: 'In Progress' } }
        ]
      },
      create: {
        steps: [
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
          { 'gitlab.assign.merge_request': { assignee: 'bruiz' } },
          { 'jira.move.card': { status: 'Reviews' } }
        ]
      },
      accept: {
        steps: [
          'gitlab.accept.merge_request'
        ]
      }
    }

  });

  grunt.registerTask('new_feat', ['ttdev:create:feat']);
  grunt.registerTask('end_feat', ['ttdev:finish:feat']);
  grunt.registerTask('new_fix', ['ttdev:create:fix']);
  grunt.registerTask('end_fix', ['ttdev:finish:fix']);

};