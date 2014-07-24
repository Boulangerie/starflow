module.exports = function () {

  String.prototype.matchesJira = function () {
    return this.toString().match(/jira/i);
  };

  String.prototype.matchesGitlab = function () {
    return this.toString().match(/gitlab/i);
  };

};