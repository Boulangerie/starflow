module.exports = function (grunt) {

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ttdev: {
      options: {
        gitlab: {
          host: 'https://git.teads.FAKE',
          project: 'GRUNT Dev Workflow' // id: 4
        },
        jira: {
          host: 'https://jira.ebuzzing.com',
          project: 'Manager' // name: Manager #11205
        }
      },
      test: {
        steps: []
      },
      create: {
        steps: [
//          { 'git.checkout': { branch: 'master' } },
//          { 'git.pull': { with_rebase: true } },
          { 'git.create.branch': { with_checkout: true } },
//          'git.push',
//          { 'gitlab.create.merge_request': { ref_branch: 'master' } },
          { 'jira.move.card': { status: 'In Progress' } }
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
          'gitlab.accept.merge_request',
          { 'git.checkout': { branch: 'master' } },
          { 'git.pull': { with_rebase: true } }
        ]
      },
      deploy: {
        steps: [
          { 'git.checkout': { branch: 'prod' } },
          { 'git.cherrypick': { commit: '<%= grunt.option("commit") %>' } },
          { 'git.push': { branch: 'prod' } },
          { 'git.checkout': { branch: 'master' } },
          { 'git.merge': { from: 'prod', to: 'master' } }
        ]
      }
    }

  });

};