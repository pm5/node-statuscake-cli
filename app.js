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
}
