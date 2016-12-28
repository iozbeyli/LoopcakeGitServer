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
  console.log(newBranch);
  tmp= oldBranch.split("/");
  oldBranch = tmp[tmp.length-1]
  console.log(oldBranch);
  var remoteBranch = remoteName + '/' + oldBranch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repo+"/");
  var repository;

  // Open a repository that needs to be fetched and fast-forwarded
  git.Repository.open(usrEnv)
    .then(function(repo) {
      repository = repo;
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
    repository.mergeBranches(oldBranch, remoteBranch);
    return repository.getCommit(commitID);
  })
  .then(function(commitOnBranch) {
      return repository.createBranch(
        newBranch,
        commitOnBranch,
        0,
        repository.defaultSignature(),
          "Created "+newBranch+" on commit "+commitOnBranch);

  }).then(function (ref) {
    console.log(ref);
    return git.Branch.setUpstream(ref, remoteName+"/"+newBranch);
  }).then(function (result) {
    console.log(result);
    console.log("success:true, details: Branch Created, branch: "+newBranch);

    return res.status(200).send({"success":true, "details": "Branch Created", "branch": newBranch});
  })
}


exports.checkout = function(req,res,next){
  console.log("Checkout request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repo = req.body.repo;
  var remoteName = 'origin';
  var reqBranch = req.body.branch;
  var repository;
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

      var branch = currentBranch.name().split("/");
      branch = branch[branch.length-1];
      var remoteBranch = remoteName + '/' + branch;
      repository.mergeBranches(branch, remoteBranch);


      return repository.checkoutBranch(reqBranch);

  })
  .then(function(result) {
    console.log("success:true, details: BRANCH CHECKOUT: It worked!");
    return res.status(200).send({"success":true, "details": "BRANCH CHECKOUT: It worked!"});
  });

}
