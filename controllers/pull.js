var archiver = require('archiver');
const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
const fs = require('fs');

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
    var output = fs.createWriteStream('/'+repoName+'.zip');
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE.
    });

    // listen for all archive data to be written
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);
    archive.directory(usrEnv);
    archive.finalize();

    console.log("success: true, details: Repository is zipped.");
    return res.status(200).send({"success":true, "details": "zipped."});
  });
};
