const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;

exports.create = function(req,res,next){

  console.log("create new branch request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var oldBranch = req.body.oldBranch;
  var newBranch = req.body.newBranch;
  var commitID = req.body.commitid;
  var repository;
  var remoteBranch = remoteName + '/' + oldBranch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repo+"/");
  var repository;

  // Open a repository that needs to be fetched and fast-forwarded
  git.Repository.open(usrEnv)
    .then(function(repo) {
      repository = repo;
      console.log("fetching");
      repository.fetch(remoteName, {

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
    repository.mergeBranches(oldBranch, remoteBranch);
    return repository.getCommit(commitID);
  })
  .then(function(commitOnBranch) {
      console.log("commit: "+commitOnBranch);
      repository.createBranch(
        newBranch,
        commitOnBranch,
        0,
        repository.defaultSignature(),
          "Created "+newBranch+" on commit "+commitOnBranch);

      return res.status(200).send("ok");
  })
}

exports.showBranch = function(req,res,next){
  console.log("show branch request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var branch = 'master';
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repo+"/");
  var repository;

  // Open a repository that needs to be fetched and fast-forwarded
  git.Repository.open(usrEnv)
    .then(function(repo) {
      repository = repo;
      console.log("fetching");
      repository.fetch(remoteName, {

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
    console.log(currentBranch.toString());

    return res.status(200).send("ok");
  })
}

exports.checkout = function(req,res,next){
  console.log("checkout request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var branch = req.body.branch;
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repo+"/");
  var repository;

  // Open a repository that needs to be fetched and fast-forwarded
  git.Repository.open(usrEnv)
    .then(function(repo) {
      repository = repo;
      return repository.getCurrentBranch();
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function(currentBranch) {
      console.log("fetching");
      repository.fetch(remoteName, {

        callbacks: {
          credentials: function(url, username) {
            return git.Cred.userpassPlaintextNew("git", "gelgit");
          },

          certificateCheck: function(){
            return 1;
          }
        }

      });
      console.log("fetched");
      console.log(currentBranch.name());
      branch = currentBranch.name().split("/");
      branch = branch[branch.length-1];
      var remoteBranch = remoteName + '/' + branch;
      repository.mergeBranches(branch, remoteBranch);
      return repository.checkoutBranch(branch);

  })
  .then(function(result) {
    console.log("It worked!");
    return res.status(200).send({"success":true, "details": "BRANCH CHECKOUT: It worked!"});
  });

}
