# Mongoose - REST - Middleware 

Express middleware to create a RESTful API from a mongo database. 

# Installation

```bash
 $npm install restfulgoose
```

# Usage

Restfulgoose will expose a mongoose colleciton to an api endpoint.  For example, the collection `robots` defined by robotSchema

```js
var robotSchema = mongoose.Schema({
  name: String,
  type: String,
  speed: Number
});
```

will respond to the following requests.  

<table>
<tr><th>Request</th><th>Response</th></tr>
<tr><td>GET /api/robots</td><td>Get all in collection robots</td></tr>
<tr><td>GET /api/robots/1</td><td>Get robot with Id 1</td></tr>
<tr><td>POST /api/robots</td><td>Create a new robot</td></tr>
<tr><td>PUT /api/robots/1</td><td>Update the robot with Id 1</td></tr>
<tr><td>DELETE /api/robots/1</td><td>Delete the robot with Id 1</td></tr>
</table>

# Setup

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
- Pass in Mongoose models directly
- Pass in a url and a schema.  

```js
var robotSchema = mongoose.Schema({name: String, type: String, speed: Number});
var humanSchema = mongoose.Schema({name: String, personality: String, age: Number});
var Robot = mongoose.model('Robot',robotSchema);

app.use(mongo_rest({
  methods: ['GET'],
  dbname: 'testdb',
  url: 'http://localhost',
  collections: {
    robots: {
      methods: ['GET','POST'],
      model: robotSchema //pass in the model directly
    },
    humans: {
      methods: ['GET', 'POST'],
      schema: humanSchema //a model will be defined from the db connection and schema
    }
  }
}));
````


## Authorization
  Optionally pass a function to restigoose that will be used for authorization.  Authorization functions are passed on a collection by collection basis and are formatted as standard Connect middleware.

  Examples using [Passport][0] and a custom function for authentication.
```js
//pass an authorization function to the collection
//...
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
Optionally overwrite the function that determines the search query.  The serach query takes three arguments, a Mongoose query, a parsed object from the url string, and a request. 
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
  sortOrder: function(query, queryParams,  req){
   //var sortOptions = logic determining sort order
   //query.sort(sortOptions)
   },
  selectFields: function(query, queryParams, req){
   //var selectFields = logic determing which fields to select
   //query.find(selectFields)
   }
}

```

## URL Querying

Right now, we can use the url to query the collection for matches.  

-`GET` to `/api/robots?name=WallE` returns robots with the name WallE
-`GET` to `/api/robots?type=vaccuum&speed=3` returns robots of type vacuum whose favorite law is 3


[0]: http://passportjs.org/
