var app = require('express')();
var mongoose = require('mongoose');
var mongo_rest = require('../mongo_rest.js');

var robotSchema = mongoose.Schema({
  name: String,
  type: String,
  favorite_law: Number
});

app.use(mongo_rest({
  basepath: 'api',
  dbname: 'robots',
  url: 'mongodb://localhost/robots',
  collections: {
    robots: {
      methods: ['GET','POST','PUT'],
      schema: robotSchema
    }
  }
}));

app.listen(8081);