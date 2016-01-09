#!/usr/bin/env node

var _ = require('lodash');

process.slu = true;

var app;
try {
  var pkg = require(process.cwd() + '/package.json');
  if (pkg && !pkg.main) {
    console.log('Please fill `main` field in your `package.json` file');
    process.exit(1);
  }
  app = require(process.cwd());
  // TODO a better way to check app ?
  if (!app || !app.dataSources) {
    console.log('Are you running slu in a loopback project?');
    process.exit(1);
  }

} catch(e) {
  app = null;
  throw e;
}

var tools = require('../lib/tools');

tools = _.assign(tools, app && app.tools);

var args = process.argv.slice(2);
var exitAfterAction = true;
var command = args.shift();

switch (command) {
  default:
  case 'h':
  case 'help':
    if (command && command !== 'help' && command !== 'h') {
      var found = false;
      Object.keys(tools).forEach(runner(tools));
      function runner(base) {
        return function (cmd) {
          if (!base) {
            return false;
          }
          var c = base[cmd];
          if (cmd === command || (c && c.help && c.help.shortcut === command)) {
            if (cmd !== 'server' && cmd !== 's') {
              app && app.enable('tools');
            }
            exitAfterAction = false;
            c(app, args, function (err) {
              if (err) throw err;
              process.nextTick(process.exit.bind(process))
            });
            found = true;
          }
        }
      }

      if (found) {
        break;
      }
    }
    var topic = args.shift();
    if (topic) {
      showMan(topic);
      return;
    }
    var help = [
      'Usage: slu command [argument(s)]\n',
      'Commands:'
    ];
    var commands = [
      ['h', 'help [topic]',    'Display compound man page']
    ];
    Object.keys(tools).forEach(function (cmd) {
      var h = tools[cmd].help;
      if (h) {
        commands.push([h.shortcut || '', h.usage || cmd, h.description]);
      }
    });
    var maxLen = 0;
    commands.forEach(function (cmd) {
      if (cmd[1].length > maxLen) {
        maxLen = cmd[1].length;
      }
    });
    commands.forEach(function (cmd) {
      help.push('  ' + addSpaces(cmd[0] + ',', 4) + addSpaces(cmd[1], maxLen + 1) + cmd[2]);
    });
    console.log(help.join('\n'));
    break;

  case '--version':
    console.log(pkg.version);
    break;
}

if (exitAfterAction) {
  process.exit(0);
}

function showMan(topic) {
  var manDir = require('path').resolve(__dirname + '/../man');
  require('child_process').spawn(
    'man', [manDir + '/' + topic + '.3'],
    {
      customFds: [0, 1, 2],
      env: process.env,
      cwd: process.cwd()
    }
  );
}

function addSpaces(str, len, to_start) {
  var str_len = str.length;
  for (var i = str_len; i < len; i += 1) {
    if (!to_start) {
      str += ' ';
    } else {
      str = ' ' + str;
    }
  }
  return str;
}

/*vim ft:javascript*/
