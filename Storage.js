var _ = require('lodash');

function Storage(initialWorkspace) {
  this.workspace = initialWorkspace || {};
  this.children = {};
  this.root = null;
}

/**
 * Add a new child storage to the current storage
 * @param name
 * @param storage
 */
Storage.prototype.addChild = function addChild(name, storage) {
  if (_.isUndefined(this.children[name])) {
    this.children[name] = [];
  }
  storage.root = _.isNull(this.root) ? this : this.root;
  this.children[name].push(storage);
};

Storage.prototype.get = function get(path, defaultValue) {
  var extractedPath = extractPath(path);
  if (!_.isEmpty(extractedPath.namespaces)) {
    var directChildName = _.get(_.head(extractedPath.namespaces), 'name');
    var directChildIndex = _.get(_.head(extractedPath.namespaces), 'index');
    var childStorage = this.getChildAt(directChildName, directChildIndex);
    var childPath = generateChildPath(extractedPath);
    // TODO maybe do something else such as throwing an error?
    return childStorage ? childStorage.get(childPath) : undefined;
  } else { // no namespace were extracted -> path on current workspace
    return _.get(this.workspace, extractedPath.path, defaultValue);
  }
};

Storage.prototype.getChildAt = function getChildAt(name, index) {
  index = _.isUndefined(index) ? 0 : index;
  if (!this.children[name]) {
    // TODO use starflow.logger to log a warning instead of throwing an error?
    throw new Error('Unable to access child with name "' + name + '"');
  }
  return this.children[name][index];
};

Storage.prototype.set = function set(path, value) {
  var extractedPath = extractPath(path);
  if (!_.isEmpty(extractedPath.namespaces)) {
    var directChildName = _.get(_.head(extractedPath.namespaces), 'name');
    var directChildIndex = _.get(_.head(extractedPath.namespaces), 'index');
    var childStorage = this.getChildAt(directChildName, directChildIndex);
    var childPath = generateChildPath(extractedPath);
    // TODO maybe do something else such as throwing an error?
    return childStorage ? childStorage.set(childPath) : undefined;
  } else {
    return _.set(this.workspace, extractedPath.path, value);
  }
};

/**
 * Given an extracted path, generate the path used by the first child
 * @param extractedPath
 */
function generateChildPath(extractedPath) {
  // convert [{name: 'a', index: 0}, {name: 'b', index: 2}] into 'a.0/b.2'
  var namespacePart = _.map(_.tail(extractedPath.namespaces), function (namespace) {
    return [namespace.name, namespace.index].join('.');
  }).join('/');
  return _.compact([namespacePart, extractedPath.path]).join('/');
}

function extractPath(path) {
  var extraction = {
    namespaces: [],
    path: path
  };

  var splitPath = path.split('/');

  var rawNamespaces = _.initial(splitPath);
  _.forEach(rawNamespaces, function (rawNamespace) {
    var nameIndexSplit = rawNamespace.split('.');

    var index = parseInt(_.last(nameIndexSplit), 10);
    if (_.isNaN(index)) {
      index = 0;
      nameIndexSplit.push(index);
    }

    extraction.namespaces.push({
      name: _.initial(nameIndexSplit).join('.'),
      index: index
    });
  });

  extraction.path = _.last(splitPath);

  return extraction;
}

module.exports = Storage;
