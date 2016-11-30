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
    return repository.getBranchCommit(branch);;
  })
  .then(function(commitOnBranch) {
      console.log("commit: "+commitOnBranch);
      return commitOnBranch.getTree();
  })
  .then(function(tree) {
    // `walk()` returns an event.
    var blobsOnly = false;
    var walker = tree.walk();
    var result = [];
    var trees;
    walker.on("end", function(final) {
      console.log(final);
      trees = final;
      console.log(trees.length);

      for(i=0; i<trees.length ; i++){
        entryPath = trees[i].path().split(path.sep);
        console.log("path: "+entryPath);
        result.push(entryPath);
      }
      console.log("success: true, details: "+result);
      return res.status(200).send({"success":true, "details": result});
    });


    // Don't forget to call `start()`!
    walker.start();

  });

}
