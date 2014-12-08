module.exports = function (grunt) {
  'use strict';

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    tdw: {
      options: {
        branchTpl: '{{ issueType }}/{{ issueKey }}/{{ issueDesc }}',
        jira: {
          protocol: 'https',
          host: 'jira.ebuzzing.com',
          projectKey: 'MAN',
          issueTypesMatching: {
            feat: 'New Feature',
            fix: 'Bug',
            task: 'Task',
            subtask: 'Sub-task',
            epic: 'Epic',
            improv: 'Improvement',
            story: 'Story',
            techtask: 'Technical Task'
          }
        },
        gitlab: {
          protocol: 'https',
          host: 'git.teads.tv',
          projectName: 'SERVICE Manager',
          labelsMatching: {
            feat: 'feature',
            fix: 'bug'
          }
        }
      },
      c: [ // create
        { 'git.checkout': { branch: 'master' } }
        // { 'git.pull': { remote: 'origin', branch: 'master', withRebase: true } },
        // { 'git.createBranch': { withCheckout: true } },
        // 'git.push',
        // { 'gitlab.createMergeRequest': { refBranch: 'master' } },
        // 'jira.assignIssue',
        // { 'jira.changeIssueStatus': { status: 'In  Progress' } }
      ],
      f: [ // finish
        // { 'gitlab.assignMergeRequest': { assignee: 'ygalatol' } },
        // { 'jira.changeIssueStatus': { status: 'TO REVIEW' } }
      ]
    }

  });

};