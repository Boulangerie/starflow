var _ = require('lodash');

function Storage(name, initialWorkspace) {
  this.name = name || 'undefined';
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
  var logger = require('./starflow').logger;
  logger.debug('Storage "' + this.name + '" GET "' + path + '"');
  var extractedPath = this.extractPath(path);
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
    throw new Error('Unable to access child with name "' + name + '" from storage "' + this.name + '"');
  }
  return this.children[name][index];
};

Storage.prototype.set = function set(path, value) {
  var logger = require('./starflow').logger;
  logger.debug('Storage "' + this.name + '" SET "' + path + '"');
  var extractedPath = this.extractPath(path);
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

Storage.prototype.extractPath = function extractPath(path) {
  var extraction = {
    namespaces: [],
    path: path
  };

  var splitPath = path.split('/');

  var rawNamespaces = _.initial(splitPath);
  _.forEach(rawNamespaces, function (rawNamespace, rawNamespaceIndex) {
    var nameIndexSplit = rawNamespace.split('.');

    var lastElement = _.last(nameIndexSplit);
    var parsedLastElement = parseInt(lastElement, 10);
    var index = 0;

    if (_.isNaN(parsedLastElement)) {
      if (lastElement === '$last') {
        nameIndexSplit.pop(); // remove '$last'
        index = lastElement;
        if (rawNamespaceIndex === 0) {
          // special case: if index is $last and we are processing the first level of namespaces,
          // then replace $last with the real value
          index = _.size(this.children[nameIndexSplit.join('.')]) - 1;
        }
      }
    } else {
      nameIndexSplit.pop(); // remove index
      index = parsedLastElement;
    }

    extraction.namespaces.push({
      name: nameIndexSplit.join('.'),
      index: index
    });
  }.bind(this));

  extraction.path = _.last(splitPath);

  return extraction;
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

module.exports = Storage;
