module.exports = (function (_) {
  'use strict';

  _.mixin({
    allUndefinedOrNull: function () {
      var foundUndefinedOrNull = false;
      var i = 0;
      while (i < arguments.length && !foundUndefinedOrNull) {
        if (_.isUndefined(arguments[i]) || _.isNull(arguments[i])) {
          foundUndefinedOrNull = true;
        }
        i++;
      }
      return foundUndefinedOrNull;
    },

    isDefinedNotNull: function (val) {
      return !_.isUndefined(val) && !_.isNull(val);
    },

    isUndefinedOrNull: function (val) {
      return _.isUndefined(val) || _.isNull(val);
    }
  });

  // Function.prototype.bindArray = function bindArray(fn, args) {
  //   if (!_.isFunction(fn)) {
  //     throw new Error('First argument of bindArray must be a function');
  //   }
  //   if (!_.isArray(args)) {
  //     throw new Error('Second argument of bindArray must be an array');
  //   }
  //   args.unshift(fn);
  //   return this.bind.apply(fn, args);
  // };

})(require('lodash'));