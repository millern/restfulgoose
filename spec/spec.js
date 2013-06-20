var apieasy = require('api-easy');
var mongoose = require('mongoose');
var assert = require('assert');
var _ = require('underscore');
var vows = require('vows');

var suite = apieasy.describe('api');

var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;

suite.addBatch({
  'function 1': function(){
    console.log("Function 1 is running");
  }
  })
  .discuss('requests')
  .use('localhost', 8081)
  .get('/api/tests')
  .expect(200)
  .expect("should respond with all elements in collection", function(err, res, body){
   var result = JSON.parse(body);
     assert.isNotNull(result);
     assert(_.contains(_(result).pluck('prop1'),4));
     assert(_.contains(_(result).pluck('prop1'),12));
     assert(_.contains(_(result).pluck('prop1'),13));
  })
  .get('/api/tests/51bcb778ae39aff660000001')
  .expect(200)
  .expect("should return a single result", function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.prop1,4);
    assert.equal(result.prop2,"Nick");
  })
  .get('/api/tests/?prop1=99')
  .expect(200)
  .expect("should return results where prop1 = 99", function(err, res, body){
    var result = JSON.parse(body);
    assert(result.length===1);
    assert.equal(result[0].prop1, 99);
    assert.equal(result[0].prop2, "Ziggy");
  })
  .next()
  .setHeader('Content-Type', 'application/json')
  .post('/api/tests',{prop1: 8, prop2: "Tiger"})
  .expect(200)
  .expect("should respond with the inserted element", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.prop1,8);
     assert.equal(result.prop2,"Tiger");
     postID = result._id;
  })
  .next()
  .put('/api/tests/51bcb778ae39aff660000001', {prop1:90, prop2:"Tiger"})
  .expect(200)
  .expect("should return an object on a put", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.prop1,90);
  })
  .next()
  .del('/api/tests/51bcb778ae39aff660000001',{})
  .expect(200)
  .expect("should return a confirmation", function(err, res, body){
    assert.equal(body, "Document removed");
  })
  .post('/api/tests', {prop1:4, prop2: "Nick", _id: new BSON.ObjectID("51bcb778ae39aff660000001")})
  .expect(200)
  .expect("should return the reset object with the correct id", function(err, res, body){
    var result = JSON.parse(body);
    assert.equal(result.prop1, 4);
    assert.equal(result.prop2, "Nick");
    assert.equal(result._id, "51bcb778ae39aff660000001");
  })
  .export(module);
