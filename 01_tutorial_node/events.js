const events = require("events");

const customEmitter = new events();
customEmitter.on("response", (name, id) => {
  console.log("data received user " + name + " with id: " + id);
});

customEmitter.emit("response", "Minh", 1);
