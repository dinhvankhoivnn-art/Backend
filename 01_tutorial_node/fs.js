const fs = require("fs/promises");
const path = require("path");
const _ = require("lodash");

// fs.writeFile("test.txt", "hello world");

fs.readFile("test.txt", "utf-8").then((data) => console.log(data));
let value;
value = _.camelCase("the quick brown fox");
console.log("🚀 ~ value:", value);
