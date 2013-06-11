var http = require('http');
var connect = require('connect');
var mongodb = require('mongodb');
var mongoose = require('mongoose');

var mongo_rest = require('./mongo_rest.js');

var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

var app = connect(
  connect.static(__dirname),
  connect.bodyParser(),
  passport.initialize()
);

// Setup a local stragegy to test passport authentication
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

var robotSchema = mongoose.Schema({
  name: String,
  law: Number
});
var fruitSchema = mongoose.Schema({
  name: String,
  color: String,
  taste: String
});

// TEST: Use the auth
// app.use(passport.authenticate('basic', { session: false }));

app.use(mongo_rest({
  basepath: 'api',
  dbname: 'robots',
  collections: {
    robots: {
      auth: passport.authenticate('basic', { session: false }),
      methods: ['GET','POST', 'PUT'],
      path: "robots",
      schema: roboSchema,
      queryfields: ["name", "law"]
    },
    fruits: {
      methods: ['GET', 'POST','PUT'],
      path: "fruits",
      schema: animalSchema,
      queryfields: ["name", "color", "taste"]
    }
  }
}));

var ip = '0.0.0.0';
var port = 8080;

http.createServer(app).listen(port);
console.log("listening on "+ ip + ": " + port);

var collections = {
  basepath: 'api',
  robots: {
    methods: ['GET','POST'],
    path: "robots"
  }
};