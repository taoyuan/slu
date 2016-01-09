'use strict';

var debug = require('debug')('slu:tools:db');
var async = require('async');
var util = require('util');
var _ = require('lodash');

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

  var names = [], dss = [];
  _.forEach(app.dataSources, function (ds, name) {
    if (dss.indexOf(ds) < 0) {
      names.push(name);
      dss.push(ds);
    }
  });

  if (!dss.length) {
    debug('Empty datasources.');
    return callback();
  }

  var message = util.format('Auto %s datasources: %j', action, names);
  var splitter = _.repeat('-', message.length);
  console.log(splitter);
  console.log(message);
  console.log(splitter);
  console.log();

  var completed = {};

  async.map(dss, function (ds, cb) {
    ds.connect(cb);
  }, function (err) {
    if (err) return callback(err);

    async.map(dss, function (ds, cb) {
      console.log('Auto %s database: `%s` - %j', action, ds.name, ds.settings);

      var models = Object.keys(ds.connector._models);
      console.log(' -', JSON.stringify(models));
      console.log();

      ds.setMaxListeners(models.length + (ds._maxListeners || 10));
      ds['auto' + action](function (err) {
        if (completed[ds.name]) return;
        completed[ds.name] = true;
        if (err) {
          console.error('`%s` fail! - %j', ds.name, err);
        } else {
          console.log('`%s` ok!', ds.name);
        }
        ds.disconnect();
        cb();
      });
    }, callback);
  });

}
