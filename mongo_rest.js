var url = require('url');
var _ = require('underscore');
var querystring = require('querystring');
var mongoose = require('mongoose');

module.exports = function(settings){
//build models if none passed in
  if (settings.hasOwnProperty('url')){
    mongoose.connect(settings.url);
    var db = mongoose.connection;
    db.on('error',console.error.bind(console, 'connection error:'));
    db.once('open',function(){
      for (var coll in settings.collections){
        settings.collections[coll].model = mongoose.model(coll, settings.collections[coll].schema);
      }
    });
  }


  return function(req,res,next){
    var root = function(model, urlParams){
      console.log("...find all by model...");
      var query = model.find({});
      chooseSortOrder(query, urlParams.collectionName);
      chooseSelectFields(query, urlParams.collectionName);
      chooseSearchQuery(query, urlParams.queryParams);
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
    var chooseSearchQuery = function(query, queryParams){
      //parameters from query string
      if(Object.keys(queryParams).length > 0){
        query.find(queryParms);
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
      model.findByIdAndUpdate(urlParams, req.body, function(err, document){
        console.log(JSON.stringify(document));
        res.end(JSON.stringify(document));
      });
    };
    var remove = function(model, urlParams){
      console.log('deleting record ' + urlParams.id);
      model.findByIdAndRemove(urlParams, function(err, docx){
        console.log('found record ' + docx);
        res.end("Document removed");
      });
    };
    var trailblazer = function(model, urlParams, method){
      if (method === 'GET'){
        if (urlParams.id){
          show(model, urlParams.id, urlParams.collectionName);
        } else {
          root(model, urlParams);
        }
      } else if (method === 'POST'){
        create(model, urlParams.id);
      } else if (method === 'PUT'){
        modify(model, urlParams.id);
      } else if (method === 'DELETE'){
        remove(model, urlParams.id);
      }
    };

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
      trailblazer(model, urlParams, req.method);  //pathParts - 1 = api exposure root, 2 = collection, 3 = id
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

