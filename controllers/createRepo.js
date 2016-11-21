const git = require("nodegit");
var path = require("path");

exports.create = function(req,res,next){
  var isBare = 0;
  var user = req.user;
  var repo = req.repo;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  git.Repository.init(pRepo, isBare).then(function(repo){
    console.log("success: true, details: something happened.");
    return res.status(200).send({"success":true, "details": "something happened."});
  });


};
