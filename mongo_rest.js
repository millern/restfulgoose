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

  return function(req,res,next){
    var root = function(model, urlParams){
      console.log("...find all by model...");
      var query = model.find({});
      //call sorting functions or 
      if (settings.sortOrder){
        settings.sortOrder();
      } else {
        chooseSortOrder(query, urlParams.collectionName);
      }
      if (settings.selectFields){
        settings.selectFields();
      } else {
        chooseSelectFields(query, urlParams.collectionName);
      }
      if (settings.searchQuery){
        settings.searchQuery();
      } else {
      chooseSearchQuery(query, urlParams.queryParams);
      }
      query.exec(function(err, documents){
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
      //parameters from query string
      if(Object.keys(queryParams).length > 0){
        query.find(queryParams);
      }
    };
    var show = function(model, urlParams){
      console.log('finding by id: ' + urlParams);
      model.findById(urlParams, function(err, document) {
        res.end(JSON.stringify(document));
      });
    };
    var create = function(model, urlParams){
      console.log("...insert a new record...");
      model.create(req.body, function(err, document){
        console.log(document + " inserted");
        res.end(JSON.stringify(document));
      });
    };
    var modify = function(model, urlParams){
      console.log('updating record ' + urlParams.id);
      model.findByIdAndUpdate(urlParams.id, req.body, function(err, document){
        console.log(JSON.stringify(document));
        res.end(JSON.stringify(document));
      });
    };
    var remove = function(model, urlParams){
      console.log('deleting record ' + urlParams.id);
      model.findByIdAndRemove(urlParams.id, function(err, docx){
        if (err){
          console.log("error removing document");
        } else {
        console.log('found record ' + docx);
        res.end("Document removed");
        }
      });
    };
    function trailblazer(){
      console.log("routing reached");
      if (req.method === 'GET'){
        if (urlParams.id){
          show(model, urlParams.id, urlParams.collectionName);
        } else {
          root(model, urlParams);
        }
      } else if (req.method === 'POST'){
        create(model, urlParams);
      } else if (req.method === 'PUT'){
        modify(model, urlParams);
      } else if (req.method === 'DELETE'){
        remove(model, urlParams);
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
      console.log("callpath reached");
      if(!req.body){
        console.log("parsing body");
        connect.bodyParser()(req,res,trailblazer);
      } else {
        console.log("body already parsed");
        trailblazer();  //pathParts - 1 = api exposure root, 2 = collection, 3 = id
      }
    }

    if (settings.collections.hasOwnProperty(collectionName) && _.contains(settings.collections[collectionName].methods,req.method) && settings.basepath === api){
      var auth = settings.collections[collectionName].auth;
      var model = settings.collections[collectionName].model;
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

