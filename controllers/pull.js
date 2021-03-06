var archiver = require('archiver');
const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
const fs = require('fs');
var Http = require('http');

exports.serve = function(req,res,next){
  console.log("Download Repo request recieved.");
  var user = req.query.user;
  var repo = req.query.repo;
  var repoName = req.query.repoName;
  var remoteName = 'origin';
  //var branch = 'master';
  var repository;
  //var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repo+"/");
  //var zipLoc = path.resolve(usrEnv+"/"+repoName+'.zip');
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
      return currentBranch;
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function(currentBranch) {
    var branch = currentBranch.name().split("/");
    branch = branch[branch.length-1];
    var remoteBranch = remoteName + '/' + branch;
    return repository.mergeBranches(branch, remoteBranch);
  })
  .done(function() {
    res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': 'attachment; filename='+repoName+'.zip'
    });
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE.
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(res);
    archive.glob('**/*', {
      cwd: usrEnv
    }, {}).finalize();


    console.log("success: true, details: Repository's zip is sent to client.");

  });
};
