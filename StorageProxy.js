var _ = require('lodash');
var Storage = require('./Storage');

function StorageProxy(namespace) {
  this.namespace = namespace;
}

StorageProxy.prototype.get = function get(originalPath) {
  var extractedPath = extractFromPath(originalPath);
  var fullPath = generateFullPath(this.namespace, extractedPath);
  return Storage.get(fullPath);
};

StorageProxy.prototype.set = function set(originalPath, value) {
  var extractedPath = extractFromPath(originalPath);
  var index = 0;

  // if there is already an array in the given namespace
  // then add the value at the end of the array
  var existingValue = this.get(extractedPath.namespace);
  if (existingValue) {
    index = _.size(existingValue);
  }
  extractedPath.index = index;

  var fullPath = generateFullPath(this.namespace, extractedPath);
  Storage.set(fullPath, value);
};

/**
 * Given a user-friendly path, extract the namespace + index + resource path
 * @param originalPath: string
 * @returns {{namespace: string, index: number, path: string}}
 */
function extractFromPath(originalPath) {
  var info = {
    namespace: '',
    index: -1,
    path: originalPath
  };

  var matches = originalPath.match(/(.+)\/(.+)?/);
  if (matches) {
    info.namespace = matches[1]; // e.g. "a.b/c/d.e"
    info.path = matches[2] || ''; // e.g. "1.user.name"
  }

  matches = info.path.match(/^(\d+)\./);
  if (matches) {
    info.index = parseInt(matches[1], 10);
    // remove the index from the path
    info.path = info.path.replace(matches[1] + '.', '');
  } else {
    info.index = 0;
  }

  return info;
}

/**
 * Generate a lodash-friendly path
 * @param namespace: string
 * @param extractedPath
 * @returns {string}
 */
function generateFullPath(namespace, extractedPath) {
  var childNamespace = '';
  if (!_.isEmpty(extractedPath.namespace)) {
    childNamespace = '/' + extractedPath.namespace;
  }

  var path = extractedPath.index;
  if (extractedPath.path) {
    path += '.' + extractedPath.path;
  }

  return '["' + namespace + childNamespace + '"].' + path;
}

module.exports = StorageProxy;
