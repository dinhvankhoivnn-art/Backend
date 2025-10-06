const os = require("os");

let value;
value = os.tmpdir();
value = os.type();
value = os.arch();
value = os.cpus();
value = os.freemem();
if (os.arch === "x64") {
  console.log(`kiến trúc x64`);
} else {
  console.log(`kiến trúc khác`);
}
console.log("🚀 ~ value:", value);
