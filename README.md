# Mongoose - REST - Middleware 

Express middleware to create a RESTful API from a mongo database. 

# Installation

```bash
 $npm install mongo_rest
```
# Usage

See `example` directory for a working server

```js
var app = require('express')();
var mongoose = require('mongoose');
var mongo_rest = require('../mongo_rest.js');

//set up a mongoose schema
var robotSchema = mongoose.Schema({
  name: String,
  type: String,
  favorite_law: Number
});

app.use(mongo_rest({
  basepath: 'api', //path that api endpoints will be exposed at.  e.g., localhost/api/collection
  dbname: 'testdb',
  url: 'mongodb://localhost',
  collections: {
    //by default, this api will be exposed at 'api/robots'
    robots: {
      methods: ['GET','POST','PUT', 'DELETE'],
      schema: robotSchema,
      path: robotFactory //override the default path and expose api at 'api/robotFactory'
    }
  }
}));

app.listen(8081);
```
## Passing in Models

There are two ways to tell mongo_rest about your Mongoose models.  
-Pass in Mongoose models directly
-Pass in a url and a schema

```js
var robotSchema = mongoose.Schema({
     name: String,
     law: Number
   });
var Robot = mongoose.model('Robot',robotSchema);

//both of the following configurations are valid

//...
app.use(mongo_rest({
methods: ['GET'],
url: 'http://localhost',
collections: {
  robots: {
    methods: ['GET','POST'],
    schema: robotSchema
  }
}
}));

// -OR-

//...
app.use(mongo_rest({
methods: ['GET'],
//do not pass a url in
collections: {
  robots: {
    methods: ['GET', 'POST'],
    model: Robot
  }
}
}));
```
Note that both methods cannot be used within the same application.  Do not pass a model to one collection and a schema to another.  


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
        selectFields: ['name', 'favorite_law']  //only return these fields
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
-`GET` to `/api/robots?type=vaccuum&favorite_law=3` returns robots of type vacuum whose favorite law is 3


[0]: http://passportjs.org/