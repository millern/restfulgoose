var url = require('url');
var _ = require('underscore');
var querystring = require('querystring');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var BSON = mongodb.BSONPure;

module.exports = function(params){
//build models if none passed in
  if (params.hasOwnProperty('url')){
    mongoose.connect(params.url);
    var db = mongoose.connection;
    db.on('error',console.error.bind(console, 'connection error:'));
    db.once('open',function(){
      for (var coll in params.collections){
        params.collections[coll].model = mongoose.model(coll, params.collections[coll].schema);
      }

    });
  }


  return function(req,res,next){
    var root = function(model, params, collectionName){
      console.log("...find all by model...");
      var query = model.find({});
      determineSortOrder(query, collectionName);
      query.exec(function(err, documents){
        res.end(JSON.stringify(documents));
      });
    };
    var determineSortOrder = function(query, collectionName){
      var sortBy = params.collections[collectionName].options.sortBy || '';
      console.log(sortBy);
      query.sort(sortBy);
    };
    var locate = function(model, params){
      console.log('finding by id: ' + params);
      model.findById(params, function(err, document) {
        res.end(JSON.stringify(document));
      });
    };
    var create = function(model, params){
      console.log("...insert a new record...");
      model.create(req.body, function(err, document){
        console.log(document + " inserted");
        res.end(JSON.stringify(document));
      });
    };
    var modify = function(model, params){
      console.log('updating record ' + params);
      model.findByIdAndUpdate(params, req.body, function(err, document){
        console.log(JSON.stringify(document));
        res.end(JSON.stringify(document));
      });
    };
    var remove = function(model, params){
      console.log('deleting record ' + params);
      model.findByIdAndRemove(params, function(err, docx){
        console.log('found record ' + docx);
        res.end("Document removed");
      });
    };
    var trailblazer = function(model, query, method){
      if (method === 'GET'){
        if (isValidId(query)){
          locate(model, query, collectionName);
        } else {
          root(model, query, collectionName);
        }
      } else if (method === 'POST'){
        create(model, query);
      } else if (method === 'PUT'){
        modify(model, query);
      } else if (method === 'DELETE'){
        remove(model, query);
      }
    };

    var bar = url.parse(req.url, true);
    var pathParts = bar.pathname.split('/');
    var api = pathParts[1];
    var collectionName = pathParts[2];
    var id = pathParts[3];
    var queryParams = bar.query;


    function isValidId(id){
      var regID = /[0-9a-z]{24}$/;
      return regID.test(id);
    }

    function buildQuery(idOrQuery) {
      if (isValidId(idOrQuery)){
        console.log("searching by id: " + idOrQuery);
        return idOrQuery;
      } else {
        console.log("constructing query from string: " + idOrQuery);
        return idOrQuery; //TODO no good
      }
    }

    function callPath() {
      var query = buildQuery(id);
      trailblazer(model, query, req.method, collectionName);  //pathParts - 1 = api exposure root, 2 = collection, 3 = id
    }

    if (params.collections.hasOwnProperty(collectionName) && _.contains(params.collections[collectionName].methods,req.method) && params.basepath === api){
      var auth = params.collections[collectionName].auth;
      var model = params.collections[collectionName].model;
      if (typeof auth === "function") {
        auth(req, res, callPath);
      }
      else {
        callPath();
      }
    } else {
      next();
    }
  };
};

