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

function prepareTestDb(testInfo){
  mongoose.connect('mongodb://localhost/testdb1');
  var db = mongoose.connection;
  db.on('error',console.error.bind(console, 'connection error:'));
  db.once('open',function(){
    robotModel = mongoose.model('robot', robotSchema);
    humanModel = mongoose.model('human', humanSchema);
    robotModel.find({}).remove();
    humanModel.find({}).remove();
    console.log("removing test elements");
    WallE = new robotModel({name: "WallE", type: "Box", favorite_law: 3, _id: new BSON.ObjectID("51bcb778ae39aff660000001")});
    Roomba = new robotModel({name: "Roomba", type: "Vacuum", favorite_law: 1});
    Hal = new robotModel({name: "Hal", type: "Pilot", favorite_law: 2});
    T800 = new robotModel({name: "Terminator", type: "Assassin", favorite_law: 0});
    Abe = new humanModel({name: "Abe", personality: "stern", age: 200});
    Bran = new humanModel({name: "Brandon", personality: "genial", age: 24});
    Charles = new humanModel({name: "Charles", personality: "dour", age: 30});
    Abe.save(); Bran.save(); Charles.save(); WallE.save(); Roomba.save(); Hal.save(); T800.save(function(){
      testInfo.cb(testInfo);
    });
  });
}

function testSuite(testInfo){
  var suite = APIeasy.describe('mongoose api');
  suite.use('localhost', testInfo.port)
    .get('/api/robots')
    .expect(404)
    .get('/api/robots/51bcb778ae39aff660000001')
    .expect(404)
    .get('/api/robots/?name=Terminator')
    .expect(404)
    .setHeader('Content-Type', 'application/json')
    .post('/api/robots',{name: "Inspector Gadget", type: "Detective", favorite_law: 4})
    .expect(404)
    .next()
    .put('/api/robots/51bcb778ae39aff660000001', {name: "Inspector Gadget", type: "Detective", favorite_law: 4})
    .expect(404)
    .next()
    .del('/api/robots/51bcb778ae39aff660000001',{})
    .expect(404)
    .run(endProcess);
}

function endProcess(){
  console.log("closing server");
  svr.close();
  process.exit();
}



//Test using servers with different configurations
var app = express();

app.use(restfulgoose({
  basepath: 'api',
  dbname: 'testdb1',
  url: 'mongodb://localhost',
  collections: {
    robots: {
      methods: [],
      schema: robotSchema
    }
  }
}));

var svr = app.listen(8082);

prepareTestDb({
  app: app,
  db: 'testdb1',
  port: 8082,
  cb: testSuite
});

