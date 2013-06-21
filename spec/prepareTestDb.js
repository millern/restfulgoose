var mongoose = require('mongoose');

module.exports.resetDb = function(cb){
  mongoose.connect('mongodb://localhost/testdb');
  var db = mongoose.connection;
  db.on('error',console.error.bind(console, 'connection error:'));
  db.once('open',function(){
    console.log('db connection opened');
    var robotModel = mongoose.model('robot', robotSchema);
    robotModel.find({}).remove();
    console.log("removing test elements");
    WallE = new robotModel({name: "WallE", type: "Box", favorite_law: 3, _id: new BSON.ObjectID("51bcb778ae39aff660000001")});
    Roomba = new robotModel({name: "Roomba", type: "Vacuum", favorite_law: 1});
    Hal = new robotModel({name: "Hal", type: "Pilot", favorite_law: 2});
    T800 = new robotModel({name: "Terminator", type: "Assassin", favorite_law: 0});
    WallE.save(); Roomba.save(); Hal.save(); T800.save(cb);
  });
};