const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;

exports.getHistory = function(req,res,next){

  console.log("getContentList request recieved.");
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
    console.log("merging");
    repository.mergeBranches(branch, remoteBranch);
    return repository.getBranchCommit(branch);;
  })
  .then(function(commitOnBranch) {
      console.log("commit: "+commitOnBranch);
      var eventEmitter = commitOnBranch.getHistory();
      eventEmitter.on('commit', function(commit) {
        console.log(commit);
      });
      eventEmitter.on('end', function(commits) {
        console.log("end");
        console.log(commits.join());
      });
  })
}
