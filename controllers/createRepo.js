const git = require("nodegit");
var path = require("path");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var fileName = "readme.md";
var fileContent = "This is your readme!";

fse.ensureDir = promisify(fse.ensureDir);

var repository;
var index;



exports.create = function(req,res,next){

  var isBare = 0;
  var user = req.body.user;
  var repo = req.body.repo;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  var remote = path.resolve("../repos/remotes/"+repo+"/");


  fse.ensureDir(remote, function(err) {
    if(err)
      console.log(err)

    git.Repository.init(remote, 1)
    .done(function() {
      fse.remove(usrEnv).then(function () {
        git.Clone(remote, usrEnv)
        .then(function(repo) {
          console.log("success: true, details: something happened.");
          return res.status(200).send({"success":true, "details": "something happened."});
          });
        });
    });
  });


};
