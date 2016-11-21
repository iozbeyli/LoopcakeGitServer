const git = require("nodegit");
var path = require("path");

exports.create = function(req,res,next){
  var isBare = 0;
  var user = req.body.user;
  var repo = req.body.repo;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  var remote = path.resolve("../repos/remotes/"+repo+"/");
  git.Repository.init(remote, isBare).then(function(repo){
    clone = nodegit.Clone,
    cred = nodegit.Cred;


    clone.clone(remote, usrEnv,function(err){
      if(err){
        return console.log(err);
      }
      console.log("success: true, details: something happened.");
      return res.status(200).send({"success":true, "details": "something happened."});
    })


  });


};
