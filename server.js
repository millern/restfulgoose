var http = require('http');
var connect = require('connect');
var mongodb = require('mongodb');
var mongo_rest = require('./mongo_rest.js');
var app = connect();
app.use(mongo_rest());

//var mongoserver = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT,{});
//var db_connector = new mongodb.Db("robots",mongoserver,{w:1});
//server.use('mongo_rest');

var ip = '10.0.1.82';
var port = 8080;

http.createServer(app).listen(port);
console.log("listening on "+ip + ": " + port);