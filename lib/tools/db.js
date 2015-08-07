'use strict';

var debug = require('debug')('slu:tools:db');
var async = require('async');

module.exports = database;

database.help = {
  shortcut: 'db',
  usage: 'database update|migrate [datasource(s)]',
  description: 'Update|Migrate database.'
};

var actions = ['update', 'migrate'];

function database(app, args, callback) {
  var action = args.shift() || 'update';
  action = action.toLowerCase();

  if (actions.indexOf(action) < 0) {
    return callback(new Error('Unknown action `' + action + '`'));
  }

  var datasources = args.length ? args : Object.keys(app.dataSources);
  if (!datasources.length) {
    debug('Empty datasources.');
    return callback();
  }

  var processed = [];
  var ds;
  async.map(datasources, function (name, cb) {
    ds = app.dataSources[name];
    if (processed.indexOf(ds) >= 0) return cb();
    debug('Auto ' + action + ' database: `%s` - %j', name, ds.settings);
    ds.setMaxListeners(Object.keys(ds.models).length + (ds._maxListeners || 10));
    ds['auto' + action](function (err) {
      if (err) {
        console.error('Error in setting database: %j', err);
      } else {
        debug('Auto ' + action + ' database complete: %s', name);
      }
      ds.disconnect();
      cb();
    });
    processed.push(ds);
  }, callback);
}
