const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));

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
      return repository.getCurrentBranch();
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function(currentBranch) {
    console.log("fetched");
    console.log("merging");
    repository.mergeBranches(branch, remoteBranch);
    return repository.getBranchCommit(currentBranch);;
  })
  .then(function(commitOnBranch) {
      return commitOnBranch.getTree();
  })
  .then(function(tree) {
    // `walk()` returns an event.
    var walker = tree.walk();
    var result = [];
    walker.on("entry", function(entry) {
      result.push(entry.path().split(path.sep))
    });


    // Don't forget to call `start()`!
    walker.start();

    result = JSON.stringify(result);
    result = JSON.parse(result);

    console.log("success: true, details: "+result);
    return res.status(200).send({"success":true, "details": result});
  })
  .done();
}
