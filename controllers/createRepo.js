const git = require("nodegit");
var path = require("path");

exports.create = function(req,res,next){
  var pRepo = path.resolve("../courses/denemecourse/denemeproject/denemegroup/");
  var isBare = 0;
  git.Repository.init(pRepo, isBare).then(function(repo){
    console.log("success: true, details: something happened.");
    return res.status(200).send({"success":true, "details": "something happened."});
  });


};
