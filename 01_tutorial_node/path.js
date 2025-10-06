const path = require("path");
// console.log(path);
let value;
value = path.sep;
value = path.join("/data", "/json", "data.json");
value = path.basename(__dirname);
value = absolutePath = path.resolve(__dirname, "index.html");
console.log("🚀 ~ value:", value);
