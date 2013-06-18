var mongoose = require('mongoose');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;

mongoose.connect('mongodb://localhost/robots');
var db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'));
db.once('open',function(){
  console.log('db connection opened');
  var testSchema = mongoose.Schema({
    prop1: Number,
    prop2: String
  });
  var testModel = mongoose.model('test', testSchema);
  testModel.find({}).remove();
  console.log("removing test elements");
  nick = new testModel({prop1: 4, prop2: "Nick", _id: new BSON.ObjectID("51bcb778ae39aff660000001")});
  tucker = new testModel({prop1: 12, prop2: "Tucker"});
  fred = new testModel({prop1: 13, prop2: "Fred"});
  alan = new testModel({prop1: 1, prop2: "Alan"});
  ziggy = new testModel({prop1: 99, prop2: "Ziggy"});
  nick.save(); tucker.save(); fred.save(); alan.save(); ziggy.save();
  });
