var url = require('url');
var querystring = require('querystring');
var mongoose = require('mongoose');
var connect = require('connect');
var settings;

// Build models for collections when no collection passed in
var  buildModels = function() {

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

};

// Make array of collection access points
var buildCollectionArray = function() {

  var collections = settings.collections;
  var collMap = {};
  for (var coll in collections){
    if (collections[coll].hasOwnProperty('path')){
      collMap[collections[coll]['path']] = coll;
    } else {
      collMap[coll] = coll;
    }
  }

};

var isValidBSONId = function(id){
  var regID = /[0-9a-z]{24}$/;
  return regID.test(id);
};

var enterAPI = function(req, res, next) {

  var collectionName = req.urlParams.collectionName;
  var collections = settings.collections;

  // Enter the API if a route has been set up for this Collection/Method pair
  if (collections.hasOwnProperty(collectionName) && contains(collections[collectionName].methods,req.method)){
    var auth = collections[collectionName].auth;
    req.urlParams.model = collections[collectionName].model;

    // If auth function provided, call it as middleware, passing our next function as 'next'
    if (typeof auth === "function") {
      auth(req, res, function(){
        callPath(req, res, next);
      });
    }
    else {
      callPath(req,res,next);
    }
  } else {
    res.statusCode = 404;
    res.end("Collection Not Found");
  }

};

var contains = function(array, item) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === item)
      return true;
  }
  return false;
}

var callPath = function(req, res, next) {

  if(!req.body){
    connect.bodyParser()(req, res, function() {
      dispatch(req, res, next);
    });
  } else {
    dispatch(req, res, next);
  }

};

var dispatch = function(req, res, next){

  if (req.method === 'GET') {
    if (req.urlParams.id)
      show(req, res, next);
    else
      root(req, res, next);
  } else if (req.method === 'POST'){
    create(req, res, next);
  } else if (req.method === 'PUT'){
    modify(req, res, next);
  } else if (req.method === 'DELETE'){
    remove(req, res, next);
  }

};

var show = function(req, res, next){

  req.urlParams.model.findById(req.urlParams.id, function(err, document) {
    if (err)
      return next(err);
    res.end(JSON.stringify(document));
  });

};

//var root = function(model, urlParams){
var root = function(req, res, next){

  // Initialize a query for the requested model
  var query = req.urlParams.model.find({});

  // If present, use custom sort function.  Else, choose sort order from options.
  if (settings.collections[req.urlParams.collectionName].sortOrder){
    settings.sortOrder(query, req.urlParams.queryParams, req);
  } else {
    chooseSortOrder(query, req.urlParams.collectionName);
  }
  if (settings.selectFields){
    settings.selectFields(query, req.urlParams.queryParams, req);
  } else {
    chooseSelectFields(query, req.urlParams.collectionName);
  }
  if (settings.searchQuery){
    settings.searchQuery(query, req.urlParams.queryParams, req);
  } else {
    chooseSearchQuery(query, req.urlParams.queryParams);
  }

  query.exec(function(err, documents){
    if (err)
      return next(err);
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
    if(selectFields && selectFields.length > 0) {
      query.select(selectFields.join(' '));
    }
  }

};

var chooseSearchQuery = function(query, queryParams, req){

  if(Object.keys(queryParams).length > 0) {
    query.find(queryParams);
  }

};

var create = function(req, res, next) {

  req.urlParams.model.create(req.body, function(err, document){
    if (err)
      return next(err);
    res.end(JSON.stringify(document));
  });

};

var modify = function(req, res, next) {

  req.urlParams.model.findByIdAndUpdate(req.urlParams.id, req.body, function(err, document){
    if (err)
      return next(err);
    res.end(JSON.stringify(document));
  });

};

var remove = function(req, res, next) {

  req.urlParams.model.findByIdAndRemove(req.urlParams.id, function(err, docx){
    if (err)
      return next(err);
    res.end("Document removed");
  });

};

module.exports = function(_settings) {

  settings = _settings;

  buildModels();

  buildCollectionArray();

  return function(req,res,next) {

    // Parse the url 
    var parsedUrl = url.parse(req.url, true);

    // PathParts [1] - api, [2] - collection, [3] - id, [4] - query 
    var pathParts = parsedUrl.pathname.split('/');
    var api = pathParts[1];

    // Determine whether this request is directed at the API
    if (api === settings.basepath) {

      req.urlParams = {
        collectionName: pathParts[2],
        id: isValidBSONId(pathParts[3]) ? pathParts[3] : null,
        nestedQuery: pathParts[4],
        queryParams: parsedUrl.query
      };

      // Enter the module
      enterAPI(req, res, next);
    } else {
      next();
    }

  };
};
