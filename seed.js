'use strict';

var seed = require('./lib/tools/seed');

/**
 * Loopback Seed Component
 * @param app
 * @param options
 */
module.exports = function (app, options) {
  options = options || {};
  app.tools = app.tools || {};
  app.tools.seed = seed.tool;
  app.seed = function (dir, done) {
    if (typeof dir === 'function') {
      done = dir;
      dir = null;
    }
    dir = dir || options.seeds;
    return seed(app, 'plant', dir, done);
  };
};
