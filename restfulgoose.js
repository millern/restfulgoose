var url = require('url');
var _ = require('underscore');
var querystring = require('querystring');
var mongoose = require('mongoose');
var connect = require('connect');

module.exports = function(settings){
  //build models for collections when no collection passed in
  if (settings.hasOwnProperty('url')){
    mongoose.connect(settings.url + '/' + settings.dbname);
    var db = mongoose.connection;
    db.on('error',console.error.bind(console, 'connection error:'));
    db.once('open',function(){
      for (var coll in settings.collections){
        if(!settings.collections[coll].model){
          settings.collections[coll].model = mongoose.model(coll, settings.collections[coll].schema);
        }
      }
    });
  }
  //make array of collection access points
  var collections = settings.collections;
  var collMap = {};
  for (var coll in collections){
    if (collections[coll].hasOwnProperty('path')){
      collMap[collections[coll]['path']] = coll;
    } else {
      collMap[coll] = coll;
    }
  }
  console.log("collection map: ", collMap);

  return function(req,res,next){
    var root = function(model, urlParams){
      var query = model.find({});
      if (settings.sortOrder){
        settings.sortOrder(query, queryParams, req);
      } else {
        chooseSortOrder(query, urlParams.collectionName);
      }
      if (settings.selectFields){
        settings.selectFields(query, queryParams, req);
      } else {
        chooseSelectFields(query, urlParams.collectionName);
      }
      if (settings.searchQuery){
        settings.searchQuery(query, queryParams, req);
      } else {
      chooseSearchQuery(query, urlParams.queryParams);
      }
      query.exec(function(err, documents){
        console.log('executing root query');
        if (err){
          console.log("Error fetching root");
          return next(err);
        }
        res.end(JSON.stringify(documents));
      });
    };

    var chooseSortOrder = function(query, collectionName){
      if (settings.collections[collectionName].options){
        var sortBy = settings.collections[collectionName].options.sortBy || '';
        query.sort(sortBy);
      }
    };
    var chooseSelectFields = function(query, collectionName){
      if(settings.collections[collectionName].options){
        var selectFields = settings.collections[collectionName].options.selectFields;
        if(selectFields && selectFields.length > 0){
          query.select(selectFields.join(' '));
        }
      }
    };
    var chooseSearchQuery = function(query, queryParams, req){
      if(Object.keys(queryParams).length > 0){
        query.find(queryParams);
      }
    };
    var show = function(model, urlParams){
      model.findById(urlParams, function(err, document) {
        if (err){
          return next(err);
        } else {
        res.end(JSON.stringify(document));
        }
      });
    };
    var create = function(model, urlParams){
      model.create(req.body, function(err, document){
        if (err){
          console.log("Error creating document");
          return next(err);
        }
        res.end(JSON.stringify(document));
      });
    };
    var modify = function(model, urlParams){
      model.findByIdAndUpdate(urlParams.id, req.body, function(err, document){
        if (err){
          console.log("Error modifying document");
          return next(err);
        }
        res.end(JSON.stringify(document));
      });
    };
    var remove = function(model, urlParams){
      model.findByIdAndRemove(urlParams.id, function(err, docx){
        if (err){
          console.log("Error removing the document");
          return next(err);
        }
        res.end("Document removed");
      });
    };
    function trailblazer(){
      if (req.method === 'GET'){
        if (urlParams.id){
          show(urlParams.model, urlParams.id, urlParams.collectionName);
        } else {
          root(urlParams.model, urlParams);
        }
      } else if (req.method === 'POST'){
        create(urlParams.model, urlParams);
      } else if (req.method === 'PUT'){
        modify(urlParams.model, urlParams);
      } else if (req.method === 'DELETE'){
        remove(urlParams.model, urlParams);
      }
    }

    //set the url params
    var parsedUrl = url.parse(req.url, true);
    var pathParts = parsedUrl.pathname.split('/');
    var api = pathParts[1];
    var collectionName = pathParts[2];

    var urlParams = {
      collectionName: pathParts[2],
      id: isValidId(pathParts[3]) ? pathParts[3] : null,
      nestedQuery: pathParts[4],
      queryParams: parsedUrl.query
    };

    function isValidId(id){
      var regID = /[0-9a-z]{24}$/;
      return regID.test(id);
    }

    function callPath() {
      if(!req.body){
        connect.bodyParser()(req,res,trailblazer);
      } else {
        trailblazer();  //pathParts - 1 = api exposure root, 2 = collection, 3 = id
      }
    }
    function enterAPI() {
      if (settings.collections.hasOwnProperty(collectionName) && _.contains(settings.collections[collectionName].methods,req.method)){
        var auth = settings.collections[collectionName].auth;
        urlParams.model = settings.collections[collectionName].model;
        if (typeof auth === "function") {
          auth(req, res, callPath);
        }
        else {
          callPath();
        }
      } else {
        res.statusCode = 404;
        res.end("Collection Not Found");
      }
    }

    if (api === settings.basepath){
      enterAPI();
    } else {
      next();
    }

  };
};

