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

var statuscake = require("statuscake")
  .username(conf.username)
  .key(conf.key);
var cliTable = require("cli-table");

var argv = process.argv.slice(2);

if (argv.length === 0) {
  console.log("Usage: sccli [command]");
  console.log("Commands:");
  console.log("  test               list all tests");
  console.log("  test <id>          show details of a test");
  console.log("  test add           add a test");
  console.log("  test remove <id>   remove a test");
  console.log("  test edit <id>     edit a test");
  process.exit(0);
}

if (argv[0] === "test" && argv.length === 1) {
  statuscake.tests(function (err, data) {
    var table = new cliTable({
      head: ["TestID", "WebsiteName", "Status", "Uptime"],
    });
    data.forEach(function (d) {
      table.push([
        d.TestID, d.WebsiteName, d.Status, d.Uptime
      ]);
    });
    console.log(table.toString());
  });
} else if (argv[0] === "test" && argv.length === 2) {
  statuscake.testsDetails(parseInt(argv[1]), function (err, data) {
    var table = new cliTable();
    ["TestID", "WebsiteName", "URI", "Method", "Uptime", "DownTimes", "LastTested", "ContactGroup"].forEach(function (name) {
      var d = {};
      d[name] = data[name] || "";
      table.push(d);
    });
    console.log(table.toString());
  });
}
