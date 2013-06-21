var vows = require('vows');
var assert = require('assert');
var APIeasy = require('api-easy');
var express = require('express');
var mongoose = require('mongoose');
var mongodb = require('mongodb');
var mongo_rest = require('../mongo_rest.js');
var BSON = mongodb.BSONPure;
var _ = require('underscore');

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
var humanModel = mongoose.model('human', humanSchema);

function prepareTestDb(testInfo){
  mongoose.connect('mongodb://localhost/' + testInfo.db);
  var db = mongoose.connection;
  db.on('error',console.error.bind(console, 'connection error:'));
  db.once('open',function(){
    console.log('db connection opened');
    testInfo.robotModel = mongoose.model('robot', robotSchema);
    testInfo.humanModel = mongoose.model('human', humanSchema);
    testInfo.robotModel.find({}).remove();
    testInfo.humanModel.find({}).remove();
    console.log("removing test elements");
    WallE = new testInfo.robotModel({name: "WallE", type: "Box", favorite_law: 3, _id: new BSON.ObjectID("51bcb778ae39aff660000001")});
    Roomba = new testInfo.robotModel({name: "Roomba", type: "Vacuum", favorite_law: 1});
    Hal = new testInfo.robotModel({name: "Hal", type: "Pilot", favorite_law: 2});
    T800 = new testInfo.robotModel({name: "Terminator", type: "Assassin", favorite_law: 0});
    Abe = new testInfo.humanModel({name: "Abe", personality: "stern", age: 200});
    Bran = new testInfo.humanModel({name: "Brandon", personality: "genial", age: 24});
    Charles = new testInfo.humanModel({name: "Charles", personality: "dour", age: 30});
    Abe.save(); Bran.save(); Charles.save(); WallE.save(); Roomba.save(); Hal.save(); T800.save(function(){
      testInfo.cb(testInfo);
    });
  });
}

function testSuite(testInfo){
var suite = APIeasy.describe('mongoose api');
suite.use('localhost', 8083)
  .describe('when using an authorization message')
  .setHeader('Content-Type','application/json')
  .get('/api/robots')
  .expect(401)
  .expect("should return an unauthorized message", function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result, "user not authorized");
  })
  .next()
  .setHeader("authorization","123456789")
  .get('/api/robots')
  .expect(200)
  .expect('should return all elements in the collection', function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.length, 4);
  })
  .run(endProcess);
}

function endProcess(){
  svr.close();
  process.exit();
}

var app = express();

app.use(mongo_rest({
  basepath: 'api',
  dbname: 'testdb0',
  url: 'mongodb://localhost',
  collections: {
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],
      schema: robotSchema,
      auth: function(req, res, next){
        console.log("authorizing request");
        console.log(req.headers['authorization']);
        if (req.headers['authorization'] === '123456789'){
          next();
        } else {
          res.statusCode = 401;
          res.end(JSON.stringify('user not authorized'));
        }
      }
    },
    humans: {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      model: humanModel
      //auth: function(){
        //TODO:  set up passport authentication and use as authentication
      //}
    }
  }
}));

var svr = app.listen(8083);
appInfo = {
  app: app,
  db: 'testdb3',
  port: 8083,
  cb: testSuite
};

prepareTestDb(appInfo);


