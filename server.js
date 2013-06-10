var http = require('http');
var connect = require('connect');
var mongodb = require('mongodb');
var connectRoute = require('connect-route');
var mongo_rest = require('./mongo_rest.js');
var app = connect(
  connect.static(__dirname),
  connect.bodyParser()
  );
app.use(mongo_rest());

var ip = '10.0.1.82';
var port = 8080;

http.createServer(app).listen(port);
console.log("listening on "+ip + ": " + port);