module.exports = function (grunt) {

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ttdev: {
      options: {
        credentials_file: __dirname + '/tasks/credentials.js',
        gitlab: {
          host: 'https://git.teads.tv',
          project: 'GRUNT Teads Dev' // id: 4
        },
        jira: {
          host: 'https://jira.teads.tv',
          project: 10300 // name: Manager
        }
      },
      create: {
        steps: [
          { 'git.checkout': { branch: 'master' } },
          { 'git.pull': { with_rebase: true } },
          { 'git.create.branch': { with_checkout: true } },
          'git.push',
          { 'gitlab.create.merge_request': { ref_branch: 'master' } },
//          { 'jira.move.card': { status: 'In Progress' } }
        ]
      },
      finish: {
        steps: [
          { 'gitlab.assign.merge_request': { assignee: 'bruiz' } },
//          { 'jira.move.card': { status: 'Reviews' } }
        ]
      },
      accept: {
        steps: [
          'gitlab.accept.merge_request'
        ]
      },
      deploy: {
        steps: [
          { 'git.checkout': { branch: 'prod' } },
          { 'git.cherrypick': { commit: '<%= grunt.option("commit") %>' } },
          { 'git.pull': { branch: 'prod' } },
//          { 'git.push': { branch: 'prod' } },
          { 'git.checkout': { branch: 'master' } },
          { 'git.merge': { from: 'prod', to: 'master' } }
        ]
      }
    }

  });

};