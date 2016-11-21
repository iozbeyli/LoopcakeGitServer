const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
var ncp = require("ncp").ncp;
const fs = require('fs');

exports.bake = function(req,res,next){

  console.log("Push request recieved.");
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var branch = 'master';
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  console.log("Pulling remote.");
  open(usrEnv)
        .then(function (_repository) {
            console.log('Repo Opened!');
            repository = _repository;
            return repository.fetch(remoteName);
        })
        .then(function () {
          console.log('Fetched!');

          console.log("Pulling Done!");
          var path = req.file.path;
          console.log("Copying from: "+path);
          console.log("To: "+usrEnv);
          console.log(req.file.filename);

          ncp.limit = 16;

          ncp(path, usrEnv, function (err) {
            if (err) {
              return console.error(err);
            }
            var read_stream =  fs.createReadStream(path);
            fs.unlink(path);
            console.log('Copied!');

            var ref = "refs/heads/master";
            console.log('Pushing!');
            remoteResult = repository.getRemote(remoteName);
            remoteResult.connect(git.Enums.DIRECTION.PUSH);
            remoteResult.push(["refs/heads/master:refs/heads/master"]);
            console.log("It worked!");
            return res.status(200).send({"success":true, "details": "It worked!"});
          });
        })



};
