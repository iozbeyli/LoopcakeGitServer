var archiver = require('archiver');
const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
const fs = require('fs');
var Http = require('http');

exports.serve = function(req,res,next){
  console.log("Push request recieved.");
  var user = req.body.user;
  var repo = req.body.repo;
  var repoName = req.body.repoName;
  var remoteName = 'origin';
  var branch = 'master';
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  //var zipLoc = path.resolve(usrEnv+"/"+repoName+'.zip');
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
    res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': 'attachment; filename=myFile.zip'
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
    }, {})
    archive.bulk([{
      expand: true, cwd: usrEnv,
      src: ['**/*']
    }]).finalize();


    console.log("success: true, details: Repository is sent to client.");

  });
};
