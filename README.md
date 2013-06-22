# Mongoose - REST - Middleware 

Express middleware to create a RESTful API from a mongo database. 

# Installation

```bash
 $npm install restfulgoose
```
# Usage

See `example` directory for a working server

```js
var app = require('express')();
var mongoose = require('mongoose');
var mongo_rest = require('restfulgoose');

//set up a mongoose schema
var robotSchema = mongoose.Schema({
  name: String,
  type: String,
  speed: Number
});

app.use(mongo_rest({
  basepath: 'api', //path that the api will be exposed at.  e.g., localhost/api/collectionname
  dbname: 'testdb',  
  url: 'mongodb://localhost',  //url of the mongodb.  Db connection will be made at mongodb://localhost/testdb
  collections: {
    //by default, this api will be exposed at 'api/robots'
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],  //
      schema: robotSchema,
      path: robotLounge //optionally expose the api at a different url, api/robotLounge in this case
    }
  }
}));

app.listen(8081);
```
## Passing in Models

There are two ways to tell restfulgoose about your Mongoose models:  
-Pass in Mongoose models directly
-Pass in a url and a schema.  

```js
var robotSchema = mongoose.Schema({name: String, type: String, speed: Number});
var humanSchema = mongoose.Schema({name: String, personality: String, age: Number});
var Robot = mongoose.model('Robot',robotSchema);

//The following configuration is valid for the above schema

app.use(mongo_rest({
  methods: ['GET'],
  url: 'http://localhost',
  collections: {
    robots: {
      methods: ['GET','POST'],
      model: robotSchema
    },
    humans: {
      methods: ['GET', 'POST'],
      schema: humanSchema
    }
  }
}));
````


## Authorization
  Optionally pass a function to restigoose that will be used for authorization.  Authorization functions are passed on a collection by collection basis and are formatted as standard Connect middleware.

  Examples using [Passport][0] and a custom function for authentication.
```js
//pass an authorization function to the collection 
collections: {
  //...
  protectedCollection: {
    methods: ['GET'],
    schema: protectedSchema,
    auth: passport.authenticate('basic', { session: false })  //using a passport Basic Authentication strategy
  }, 
  secretCollection: {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    schema: secretSchema,
    auth: function(req, res, next){ //using a custom user authentication function
            if (Math.random() > 0.5){
              next();  //call next if user authorized
            } else {
              res.end("not authorized", 404);  //handle failed user authentication
            }
        }
  }
}
```

## Options
Pass additional options to a collection
```js
collections: {
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],
      schema: robotSchema,
      path: robotFactory,
      options: {
        sortBy: '-name' //sort by name in descending order
        selectFields: ['name', 'speed']  //only return these fields
      }
    }
  }
```
##Custom Search Functions
Optionally overwrite the function that determines the search query.  The serach query takes three arguments, a query, a parsed object from the url string, and a request. 
```js
  
robots: {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  schema: robotSchema,
  searchQuery: function(query, queryParams, req){
    //for example, a mongoose query could be passed in the request
    if (req.query){
      query[req.query];
    }
  },
  sortOrder: function(){},
  selectFields: function(){}
}

```

## URL Querying

Right now, we can use the url to query the collection for matches.  

-`GET` to `/api/robots?name=WallE` returns robots with the name WallE
-`GET` to `/api/robots?type=vaccuum&speed=3` returns robots of type vacuum whose favorite law is 3


[0]: http://passportjs.org/