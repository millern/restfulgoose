var express = require('express');
var app = express();
var mongoose = require('mongoose');
var mongo_rest = require('../mongo_rest.js');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

var robotSchema = mongoose.Schema({
  name: String,
  type: String,
  favorite_law: Number
});
var humanSchema = mongoose.Schema({
  name: String,
  personality: String,
  age: Number
});
var human = mongoose.model('human', humanSchema);

app.use('/', express.static(__dirname));
app.use(express.bodyParser());
//set up a passport basic strategy for authentication
passport.use(new BasicStrategy(
  function(username, password, done) {
    if (username !== 'nick') {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (password != 'fruit') {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, {
      username: username,
      password: password
    });
  }
));

app.use(mongo_rest({
  basepath: 'api',  //path that api endpoints will be exposed at.  e.g., localhost/api/collection
  dbname: 'testdb',
  url: 'mongodb://localhost',  //db connection will be made at url/dbname
  collections: {
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],
      schema: robotSchema
    },
    humans: {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      model: human
    }
  }
}));

app.listen(8081);