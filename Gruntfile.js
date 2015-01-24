module.exports = function (grunt) {
  'use strict';

  grunt.loadTasks('tasks');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    tdw: {
      options: {
        branchTpl: '{{ issueType }}/{{ issueKey }}/{{ issueSlug }}',
        jira: {
          protocol: 'https',
          host: 'jira.ebuzzing.com',
          projectKey: 'MAN'
        },
        gitlab: {
          protocol: 'https',
          host: 'git.teads.tv',
          projectName: 'SERVICE Manager'
        }
      },
      mr: [
        { 'createMergeRequest': ['test-dev-workflow', 'master'] }
      ],
      c: [ // create
        //{ 'gitCheckout': ['master'] },
        //{ 'gitFetch': ['origin', 'master'] },
        //{ 'gitRebase': ['origin/master', 'master'] },
        { 'getJiraIssue': [] },
        //{ 'createBranch': [] },
        //{ 'gitCheckout': [] },
        //{ 'gitPush': ['origin'] },
        //{ 'gitlabCreateMergeRequest': [null, 'master'] }
        { 'assignMergeRequest': ['ygalatol'] }
        //{ 'createBranch': [] },
        //{ 'gitCheckout': [] }
        // { 'git.checkout': { branch: 'master' } }
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