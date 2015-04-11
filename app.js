"use strict"

var fs = require("fs");
var confFile = process.env.HOME + "/.statuscake.json";
if (! fs.existsSync(confFile)) {
  console.log("Generating configuration file at " + confFile + "...");
  console.log("Please fill in configurations before usage.");
  fs.writeFileSync(confFile, JSON.stringify({
    "key": "",
    "username": ""
  }, null, 2));
  process.exit(-1);
}

var conf = require(confFile);

var yargs = require('yargs')
  .usage('Usage: sccli <cmd> <subcmd>')
  .command('test', 'list all tests')
  .command('test <id>', 'show details of a test')
  .command('test add', 'add a test')
  .command('test remove <id>', 'remove a test')
  .command('test update <id>', 'update a test')
  .demand(1, 'Error: must provide a valid command.'),
  argv = yargs.argv,
  cmd = argv._[0],
  subcmd = argv._[1];

var statuscake = require("statuscake")
  .username(conf.username)
  .key(conf.key);
var cliTable = require("cli-table");

if (cmd === "test" && subcmd === undefined) {
  statuscake.tests(function (err, data) {
    var table = new cliTable({
      head: ["TestID", "WebsiteName", "Status", "Uptime", "ContactGroup"],
    });
    data.forEach(function (d) {
      console.log(d);
      table.push([
        d.TestID, d.WebsiteName, d.Status, d.Uptime, (d.ContactGroup || '') + ' (' + d.ContactID + ')'
      ]);
    });
    console.log(table.toString());
  });
} else if (cmd === "test" && ! isNaN(parseInt(subcmd))) {
  statuscake.testsDetails(parseInt(subcmd), function (err, data) {
    var table = new cliTable();
    ["TestID", "WebsiteName", "URI", "Method", "CheckRate", "Uptime", "DownTimes", "LastTested", "TestType", "ContactGroup", "TestTags"].forEach(function (name) {
      var d = {};
      d[name] = data[name] || "";
      table.push(d);
    });
    console.log(table.toString());
  });
} else if (cmd === "test" && (subcmd === "add" || subcmd === "update")) {
  var data = {
    WebsiteName:  argv.name,
    WebsiteURL:   argv.url,
    CheckRate:    argv["check-rate"] || 300,
    TestType:     argv["test-type"] || 'HTTP',
  };
  if (subcmd === "update") {
    data.TestID = argv._[2];
  }
  ["Paused", "Port", "NodeLocations", "Timeout", "PingURL", "Confirmation", "BasicUser", "BasicPass", "Public", "LogoImage", "Branding", "WebsiteHost", "Virus", "FindString", "DoNotFind", "ContactGroup", "RealBrowser", "TriggerRate", "TestTags"].forEach(function (field) {
    var argName = field[0].toLowerCase().concat(field.substr(1));
    if (argv[argName] !== undefined) {
      data[field] = argv[argName];
    }
  });
  statuscake.testsUpdate(data, function (err, res) {
    if (res.Success) {
      if (subcmd === "add") {
        console.log("Test added with ID " + res.InsertID + ".");
      } else {
        console.log("Test with ID " + data.TestID + " updated.");
      }
      return;
    }
    console.log(res.Message);
  });
} else if (cmd === "test" && subcmd === "remove") {
  var id = argv._[2];
  statuscake.testsDelete(id, function (err, res) {
    if (res.Success) {
      console.log("Test " + id + " successfully deleted.");
      return;
    }
    console.log(res.Message);
  });
} else {
  yargs.showHelp();
}
