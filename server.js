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


//set up mongodb connection, schema, and model.  Pass models using either url/schema or model
mongoose.connect('mongodb://localhost/robots');
var db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'));
db.once('open',function(){
  console.log("connection opened");
  var robotSchema = mongoose.Schema({
    name: String,
    law: Number
  });
  var Robot = mongoose.model('Robot',robotSchema);
  var fruitSchema = mongoose.Schema({
    name: String,
    color: String,
    taste: String
  });
  var Fruit = mongoose.model('Fruit', fruitSchema);
app.use(mongo_rest({
  basepath: 'api',
  dbname: 'robots',
  collections: {
    robots: {
      auth: passport.authenticate('basic', { session: false }),
      methods: ['GET','POST', 'PUT'],
      path: "robots",
      //schema: roboSchema,
      //url: 'mongodb://localhost/robots',
      model: Robot,
      queryfields: ["name", "law"]
    },
    fruits: {
      methods: ['GET', 'POST','PUT'],
      path: "fruits",
      //schema: animalSchema,
      //url: 'mongodb://localhost/robots',
      model: Fruit,
      queryfields: ["name", "color", "taste"]
    }
  }
}));
});
// TEST: Use the auth
// app.use(passport.authenticate('basic', { session: false }));


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