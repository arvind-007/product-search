const express = require("express");
const app = express();

app.listen(3001, () => {
  console.log("Application started and Listening on port 3001");
});

// serve your css as static
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/search", (req, res) => {
  res.sendFile(__dirname + "/search.html");
});
app.post("/", (req, res) => {
  res.send("Not allowed");
});

app.put("/", (req, res) => {
  res.send("Not allowed");
});
