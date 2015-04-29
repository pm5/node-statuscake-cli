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
  .usage('Usage: sccli <cmd> <subcmd> [-j]')
  .command('alert', 'list recent alerts')
  .command('test', 'list all tests')
  .command('test <id>', 'show details of a test')
  .command('test add', 'add a test')
  .command('test remove <id>', 'remove a test')
  .command('test update <id>', 'update a test')
  .command('contact', 'list all contact groups')
  .command('location', 'list all server location')
  .describe('j', 'JSON output')
  .help('h').alias('h', 'help')
  .demand(1, 'Error: must provide a valid command.'),
  argv = yargs.argv,
  cmd = argv._[0],
  subcmd = argv._[1];

var statuscake = require("statuscake")
  .username(conf.username)
  .key(conf.key);
var cliTable = require("cli-table");

var output = function (content) {
  console.log(content);
};

if (argv.j) {
  output = function (content) {
    console.log(JSON.stringify(content));
  }
}

var message = function (content) {
  console.log(content);
};

if (cmd === "test" && subcmd === undefined) {
  statuscake.tests(function (err, data) {
    if (argv.j) {
      output(data);
      return;
    }
    var table = new cliTable({
      head: ["TestID", "WebsiteName", "Status", "Uptime", "ContactGroup"],
    });
    data.forEach(function (d) {
      table.push([
        d.TestID, d.WebsiteName, d.Status, d.Uptime, (d.ContactGroup || '') + ' (' + d.ContactID + ')'
      ]);
    });
    output(table.toString());
  });
} else if (cmd === "test" && ! isNaN(parseInt(subcmd))) {
  statuscake.testsDetails(parseInt(subcmd), function (err, data) {
    if (argv.j) {
      output(data);
      return;
    }
    var table = new cliTable();
    ["TestID", "WebsiteName", "URI", "Method", "CheckRate", "Uptime", "DownTimes", "LastTested", "TestType", "ContactGroup", "TestTags"].forEach(function (name) {
      var d = {};
      d[name] = data[name] || "";
      table.push(d);
    });
    output(table.toString());
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
  ["Paused", "WebsiteName", "Port", "NodeLocations", "Timeout", "PingURL", "Confirmation", "BasicUser", "BasicPass", "Public", "LogoImage", "Branding", "WebsiteHost", "Virus", "FindString", "DoNotFind", "ContactGroup", "RealBrowser", "TriggerRate", "TestTags"].forEach(function (field) {
    var argName = field[0].toLowerCase().concat(field.substr(1));
    if (argv[argName] !== undefined) {
      data[field] = argv[argName];
    }
  });
  statuscake.testsUpdate(data, function (err, res) {
    if (argv.j) {
      output(res);
      return;
    }
    if (res.Success) {
      if (subcmd === "add") {
        message("Test added with ID " + res.InsertID + ".");
      } else {
        message("Test with ID " + data.TestID + " updated.");
      }
      return;
    }
    message(res.Message);
  });
} else if (cmd === "test" && subcmd === "remove") {
  var id = argv._[2];
  statuscake.testsDelete(id, function (err, res) {
    if (argv.j) {
      output(res);
      return;
    }
    if (res.Success) {
      message("Test " + id + " successfully deleted.");
      return;
    }
    message(res.Message);
  });
} else if (cmd === "contact") {
  statuscake.contactGroups(function (err, data) {
    if (argv.j) {
      output(data);
      return;
    }
    var table = new cliTable({
      head: ["GroupName", "ContactID", "Emails"]
    });
    data.forEach(function (d) {
      table.push([
        d.GroupName, d.ContactID, d.Emails.map(function (e) { return e.trim(); }).join("\n")
      ]);
    });
    output(table.toString());
  });
} else if (cmd === "alert") {
  statuscake.alerts(function (err, data) {
    if (argv.j) {
      output(data);
      return;
    }
    var table = new cliTable({
      head: ["Triggered", "Status", "TestID"]
    });
    data.slice(0, 8).forEach(function (d) {
      table.push([
        d.Triggered, d.Status, d.TestID
      ]);
    });
    output(table.toString());
  });
} else if (cmd === "location") {
  statuscake.locationsJSON(function (err, data) {
    if (argv.j) {
      output(data);
      return;
    }
    var head = ["guid", "servercode", "title", "ip", "countryiso", "status"];
    var table = new cliTable({head: head});
    Object.keys(data).forEach(function (key) {
      table.push(head.map(function (h) { return data[key][h]; }))
    });
    output(table.toString());
  });
} else {
  yargs.showHelp();
}
