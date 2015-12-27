module.exports = function githubFactory(token) {
  var GithubApi = require('github');
  try {
    var api = new GithubApi({version: '3.0.0'});
    api.authenticate({
      type: 'oauth',
      token: token
    })
  }
  catch (err) {
    throw err;
  }

  return {
    assignPR: require('./assignPR')(api),
    createPR: require('./createPR')(api),
    getProject: require('./getProject')(api),
    getPRBetween: require('./getPRBetween')(api)
  };
};
