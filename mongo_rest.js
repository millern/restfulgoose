var url = require('url');
var _ = require('underscore');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var BSON = mongodb.BSONPure;

module.exports = function(params){
  var mongoserver = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT,{});
  var client = new mongodb.Db(params.dbname, mongoserver,{w:1});

  return function(req,res,next){
    var routes = {
      'GET': [
        {
          root: function(collection){
            console.log('find all in collection');
            client.open(function(err,p_client){
              client.collection(collection,function(err,collection){
                collection.find().toArray(function(err,results){
                  res.end(JSON.stringify(results));
                  client.close();
                });
              });
            });
           },
          id: function(collection, query){
            console.log('finding by id: ' + query);
            client.open(function(err,p_client){
              client.collection(collection,function(err,collection){
                collection.findOne({_id: new BSON.ObjectID(query)}, function(err, item) {
                  res.end(JSON.stringify(item));
                  client.close();
                });
              });
            });
           },
          query: function(collection, query){
            console.log('query');
            res.end(JSON.stringify("queried by query"));
            client.close();
          }
        }
      ],
      'POST': [
        {
          root: function(collection){
            console.log("add a new record");
            client.open(function(err,p_client){
              client.collection(collection,function(err,collection){
                collection.insert(req.body, {safe:true}, function(err,result){
                  if (err){
                    res.end("An error occured");
                  } else {
                    console.log(JSON.stringify(result[0]) + " inserted");
                    res.end(JSON.stringify(result[0]));
                    client.close();
                  }
                });
              });
            });
          },
          id: function(collection, query){
            console.log("updating a record");
            client.open(function(err,p_client){
              client.collection(collection,function(err,collection){
                collection.update({_id: new BSON.ObjectID(query)}, req.body, function(err, item) {
                  console.log(JSON.stringify(item) + " updated");
                  res.end(JSON.stringify(item));
                  client.close();
                });
              });
            });
          }
        }
      ]
    };
    var trailblazer = function(collection, query, method){
      if (query){
        routes[method][0].id.apply(null,[collection, query]);
      } else {
        routes[method][0].root.apply(null,[collection]);
      }
    };
    var pathParts = url.parse(req.url).pathname.split('/');
    var collectionName = pathParts[2];
    var idOrQuery = pathParts[3];

    function callPath() {
      trailblazer(collectionName, idOrQuery, req.method);  //pathParts - 1 = api exposure root, 2 = collection, 3 = id
    }
    if (params.collections.hasOwnProperty(collectionName) && _.contains(params.collections[collectionName].methods,req.method)){
      var auth = params.collections[collectionName].auth;
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

