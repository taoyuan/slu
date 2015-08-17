'use strict';

var debug = require('debug')('slu:tools:db');
var async = require('async');
var util = require('util');

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

  var message = util.format('Auto %s datasources: %j', action, datasources);
  var dash = '';
  for (var i = 0; i < message.length; i++) dash += '-';

  console.log(dash);
  console.log(message);
  console.log(dash);
  console.log();

  var processed = [], completed = {};
  var ds, models;
  async.map(datasources, function (name, cb) {
    ds = app.dataSources[name];
    if (processed.indexOf(ds) >= 0) return cb();
    console.log('Auto %s database: `%s` - %j', action, name, ds.settings);

    models = Object.keys(ds.connector._models);
    console.log(' -', JSON.stringify(models));
    console.log();

    ds.setMaxListeners(models.length + (ds._maxListeners || 10));
    ds['auto' + action](function (err) {
      if (completed[name]) return;
      completed[name] = true;
      if (err) {
        console.error('`%s` fail! - %j', name, err);
      } else {
        console.log('`%s` ok!', name);
      }
      ds.disconnect();
      cb();
    });
    processed.push(ds);
  }, callback);
}
