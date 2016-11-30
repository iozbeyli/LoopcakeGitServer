const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var recursive = require('recursive-readdir');

exports.getContentList = function(req,res,next){

  console.log("Push request recieved.");
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var branch = 'master';
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  var repository;

  // Open a repository that needs to be fetched and fast-forwarded
  git.Repository.open(usrEnv)
    .then(function(repo) {
      repository = repo;
      console.log("fetching");
      return repository.fetch(remoteName, {

        callbacks: {
          credentials: function(url, username) {
            return git.Cred.userpassPlaintextNew("git", "gelgit");
          },

          certificateCheck: function(){
            return 1;
          }
        }

      });
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function() {
    console.log("fetched");
    console.log("merging");
    return repository.mergeBranches(branch, remoteBranch);
  })
  .done(function() {
    console.log("pull Done!");
    recursive(usrEnv, function (err, files) {
      // Files is an array of filename
      console.log(files);
    });
  });
}
