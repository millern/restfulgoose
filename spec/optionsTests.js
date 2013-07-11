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
  console.log("test suite 1");
var suite = APIeasy.describe('mongoose api');
suite.use('localhost', testInfo.port)
  .get('/api/robots')
  .expect(200)
  .expect("selected fields and sort order", function(err, res, body){
     var result = JSON.parse(body);
     assert.isNotNull(result);
     var expected_laws =  [0,1,2,3];
     assert(_.every(_.pluck(result,"favorite_law"), function(item,index,coll){
      return item === expected_laws[index];
     }));
     _.each(result, function(item){
      assert(!item.hasOwnProperty('type'));
      assert(item.hasOwnProperty('name'));
      assert(item.hasOwnProperty('favorite_law'));
     });
  })
  .get('/api/humans')
  .expect(200)
  .expect('selected fields and sort order', function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.length, 3);
    var expected_ages =  [200,30,24];
    assert(_.every(_.pluck(result,"age"), function(item,index,coll){
     return item === expected_ages[index];
    }));
    _.each(result, function(item){
     assert(!item.hasOwnProperty('personality'));
     assert(item.hasOwnProperty('name'));
     assert(item.hasOwnProperty('age'));
    });
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
  dbname: 'testdb2',
  url: 'mongodb://localhost',
  collections: {
    robots: {
      methods: ['GET'],
      schema: robotSchema,
      options: {
        sortBy: 'favorite_law',
        selectFields: ['name','favorite_law']
      }
    },
    humans: {
      methods: ['GET'],
      model: humanModel,
      options: {
        sortBy: '-age',
        selectFields: ['name','age']
      }
    }
  }
}));

var svr = app.listen(8083);
appInfo = {
  app: app,
  db: 'testdb2',
  port: 8083,
  cb: testSuite
};

prepareTestDb(appInfo);


