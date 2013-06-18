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


//CONNECTION CASE 1:  set up mongodb connection, schema, and model.  Pass models using either url/schema or model
// mongoose.connect('mongodb://localhost/robots');
// var db = mongoose.connection;
// db.on('error',console.error.bind(console, 'connection error:'));
// db.once('open',function(){
//   console.log("connection opened");
//   var robotSchema = mongoose.Schema({
//     name: String,
//     law: Number
//   });
//   var Robot = mongoose.model('Robot',robotSchema);
//   var fruitSchema = mongoose.Schema({
//     name: String,
//     color: String,
//     taste: String
//   });
//   var Fruit = mongoose.model('Fruit', fruitSchema);
// app.use(mongo_rest({
//   basepath: 'api',
//   dbname: 'robots',
//   collections: {
//     robots: {
//       auth: passport.authenticate('basic', { session: false }),
//       methods: ['GET','POST', 'PUT'],
//       path: "robots",
//       //schema: roboSchema,
//       //url: 'mongodb://localhost/robots',
//       //model: Robot,
//       queryfields: ["name", "law"]
//     },
//     fruits: {
//       methods: ['GET', 'POST','PUT'],
//       path: "fruits",
//       schema: fruitSchema,
//       url: 'mongodb://localhost/robots',
//       //model: Fruit,
//       queryfields: ["name", "color", "taste"]
//     }
//   }
// }));
// });
//CONNECTION CASE 2
  var robotSchema = mongoose.Schema({
    name: String,
    law: Number
  });
  var fruitSchema = mongoose.Schema({
    name: String,
    color: String,
    taste: String
  });
  var testSchema = mongoose.Schema({
    prop1: Number,
    prop2: String
  });
app.use(mongo_rest({
  basepath: 'api',
  dbname: 'robots',
  url: 'mongodb://localhost/robots',
  collections: {
    robots: {
      //auth: passport.authenticate('basic', { session: false }),
      methods: ['GET','POST', 'PUT'],
      path: "robots",
      schema: robotSchema,
      //url: 'mongodb://localhost/robots',
      //model: Robot,
      queryfields: ["name", "law"]
    },
    fruits: {
      methods: ['GET', 'POST','PUT'],
      path: 'fruits',
      schema: fruitSchema,
      //url: 'mongodb://localhost/robots',
      //model: Fruit,
      queryfields: ["name", "color", "taste"]
    },
    tests: {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      path: 'tests',
      schema: testSchema,
      queryfields: ['prop1', 'prop2'],
      options: {
        sortBy:'-prop1' //pass as "propname" or "-propname"
      }
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