var vows = require('vows');
var assert = require('assert');
var APIeasy = require('api-easy');
var express = require('express');
var mongoose = require('mongoose');
var mongodb = require('mongodb');
var restfulgoose = require('../restfulgoose.js');
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
    testInfo.robotModel = mongoose.model('robot', robotSchema);
    testInfo.humanModel = mongoose.model('human', humanSchema);
    testInfo.robotModel.find({}).remove();
    testInfo.humanModel.find({}).remove();
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
suite.use('localhost', 8081)
  .get('/api/robots')
  .expect(200)
  .expect("should respond with all elements in collection", function(err, res, body){
   var result = JSON.parse(body);
     assert.isNotNull(result);
     assert(_.contains(_(result).pluck('name'),'WallE'));
     assert(_.contains(_(result).pluck('name'),'Roomba'));
     assert(_.contains(_(result).pluck('name'),'Hal'));
     assert(_.contains(_(result).pluck('name'),'Terminator'));
  })
  .get('/api/robots/51bcb778ae39aff660000001')
  .expect(200)
  .expect("should return a single result", function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.name,"WallE");
    assert.equal(result.type,"Box");
    assert.equal(result.favorite_law,3);
  })
  .get('/api/robots/?name=Terminator')
  .expect(200)
  .expect("should return results where the name is Terminator", function(err, res, body){
    var result = JSON.parse(body);
    assert(result.length===1);
    assert.equal(result[0].name, "Terminator");
    assert.equal(result[0].type, "Assassin");
    assert.equal(result[0].favorite_law, 0);
  })
  .next()
  .setHeader('Content-Type', 'application/json')
  .post('/api/robots',{name: "Inspector Gadget", type: "Detective", favorite_law: 4})
  .expect(200)
  .expect("should respond with the inserted element", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.name,"Inspector Gadget");
     assert.equal(result.type,"Detective");
     assert.equal(result.favorite_law, 4);
     postID = result._id;
  })
  .next()
  .put('/api/robots/51bcb778ae39aff660000001', {name: "Inspector Gadget", type: "Detective", favorite_law: 4})
  .expect(200)
  .expect("should return an object on a put", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.favorite_law, 4);
  })
  .next()
  .del('/api/robots/51bcb778ae39aff660000001',{})
  .expect(200)
  .expect("should return a confirmation", function(err, res, body){
    assert.equal(body, "Document removed");
  })
  .discuss('passing a second collecdtion as a model')
  .get('/api/humans')
  .expect(200)
  .expect('should return all elements in the collection', function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.length, 3);
  })
  .post('/api/humans',{name: "Davis", personality: "studious", age: 90})
  .expect(200)
  .expect("should return the inserted document", function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.name, "Davis");
    assert.equal(result.personality,"studious");
  })
  .run(endProcess);
}

function endProcess(){
  svr.close();
  process.exit();
}
var app = express();

app.use(restfulgoose({
  basepath: 'api',
  dbname: 'testdb0',
  url: 'mongodb://localhost',
  collections: {
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],
      schema: robotSchema
    },
    humans: {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      model: humanModel
    }
  }
}));

var svr = app.listen(8081);
appInfo = {
  app: app,
  db: 'testdb0',
  port: 8081,
  cb: testSuite
};

prepareTestDb(appInfo);


