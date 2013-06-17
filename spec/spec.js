var apieasy = require('api-easy');
var mongoose = require('mongoose');
var assert = require('assert');
var _ = require('underscore');

var suite = apieasy.describe('api');


suite.discuss('requests')
  .use('localhost', 8080)
  .get('/api/tests')
  .expect(200)
  .expect("should respond with all elements in collection", function(err, res, body){
   var result = JSON.parse(body);
     assert.isNotNull(result);
     assert(_.contains(_(result).pluck('prop1'),4));
     assert(_.contains(_(result).pluck('prop1'),12));
     assert(_.contains(_(result).pluck('prop1'),13));
  })
  .next()
  .setHeader('Content-Type', 'application/json')
  .post('/api/tests',{prop1: 8, prop2: "Tiger"})
  .expect(200)
  .expect("should respond with the inserted element", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.prop1,8);
     console.log(result._id);
     postID = result._id;
  })
  .next()
  .put('/api/tests/51bcb778ae39aff660000001', {prop1:90, prop2:"Tiger"})
  .expect(200)
  .expect("should return an object on a post", function(err, res, body){
     var result = JSON.parse(body);
     assert.equal(result.prop1,90);
  })
  .export(module);