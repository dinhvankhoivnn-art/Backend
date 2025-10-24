const http = require("http");

const data = [
  {
    id: 1,
    name: "John",
    age: 30,
  },
  {
    id: 2,
    name: "Jane",
    age: 25,
  },
  {
    id: 3,
    name: "Bob",
    age: 35,
  },
];
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("X-Powered-By", "Node.js");
  res.setHeader("Cookie", "23");
  res.write(`
    <ul>
      ${data.map((item) => `<li>${item.name}</li>`).join("")}
    </ul>
    
    
    `);
  res.end("<h1>Hello World</h1>");
});
const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
