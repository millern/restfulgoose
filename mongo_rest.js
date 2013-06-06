var collections = {
  basepath: 'api',
  robots: {
    methods: ['GET','POST'],
    path: "robots"
  }
};
var url = require('url');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var mongoserver = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT,{});
var client = new mongodb.Db(collections.robots.path, mongoserver,{w:1});



module.exports = function(){
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
           console.log('find by id');
           client.open(function(err,p_client){
             client.collection(collection,function(err,collection){
               collection.find({_id: query }).toArray(function(err,results){
                 res.end(JSON.stringify(results));
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
      'POST': []
    };
    var trailblazer = function(collection, id, method){
      console.log("BSON", BSON.ObjectID(id));
      if (id){
        routes[method][0].id.apply(null,[collection, BSON.ObjectID(id)]);
      } else {
        routes[method][0].root.apply(null,[collection]);
      }
    };
    var pathParts = url.parse(req.url).pathname.split('/');
    var method = req.method;
    var base = pathParts[1];
    var collection = pathParts[2];
    var id = pathParts[3];
    console.log("path parts: ",pathParts);
    if(base === collections.basepath){
      trailblazer(collection, id, method);
    } else {
      console.log("calling next module");
      next();
    }
  };
};

