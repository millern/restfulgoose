var collections = {
  basepath: 'api',
  robots: {
    methods: ['GET','POST'],
    path: "robots"
  }
};
var url = require('url');
var mongodb = require('mongodb');
var mongoserver = new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT,{});
var client = new mongodb.Db(collections.robots.path, mongoserver,{w:1});



module.exports = function(){
  return function(req,res,next){
    var pathParts = url.parse(req.url).pathname.split('/');
    var method = req.method;
    var base = pathParts[1];
    var collection = pathParts[2];
    var query = pathParts[3];
    if(base === collections.basepath){
      client.open(function(err,p_client){
        client.collection(collection,function(err,collection){
          collection.find().toArray(function(err,results){
            console.log(results);
            res.end(JSON.stringify(results));
            client.close();
          });
        });
      });
    } else {
      console.log("calling next module");
      next();
    }
  };
};

var routes = {
  'GET': [
    { pattern: /\/$/,
      method: function(){
        console.log('find all in collection');

      }
    }
  ],
  'POST': []
};

var trailblazer = function(pathname, method){
  routes[method].some(function(item){
  });
};
