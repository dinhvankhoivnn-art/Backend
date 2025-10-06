let count = 0;
if (count < 10) {
  console.log("count is less than 10");
} else if (count > 10) {
  console.log("count is greater than 10");
} else {
  console.log("count is equal to 10");
}

// ! global:

// __dirname ==> thư mục hiện tại
// __filename ==> file hiện tại
// require => import file
// module ==> lấy module
// process => lấy biến môi trường .env

console.log(__filename);
setTimeout(function () {
  console.log(__dirname);
  console.log(__filename);
  console.log(require);
  console.log(module);
  console.log(process);
}, 1000);
