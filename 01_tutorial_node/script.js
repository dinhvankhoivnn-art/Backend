const _ = require("lodash");
const items = [1, [2, [3, [4]]]];
let value;
value = _.flatMapDeep(items);
console.log("🚀 ~ value:", value);
