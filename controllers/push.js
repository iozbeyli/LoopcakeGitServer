const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
//var ncp = require("ncp");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var extractor = require("extract-zip");

exports.bake = function(req,res,next){

  console.log("Push request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var username = req.body.username;
  var usermail = req.body.usermail;
  var commitMsg = req.body.commitMsg;
  var repo = req.body.repo;
  var remoteName = 'origin';
  //var branch = 'master';
  var repository;
  //var remoteBranch = remoteName + '/' + branch;
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
    var branch = currentBranch.name().split("/");
    branch = branch[branch.length-1];
    var remoteBranch = remoteName + '/' + branch;
    repository.mergeBranches(branch, remoteBranch);
    return repository.mergeBranches(branch, remoteBranch);
  })
  .done(function() {

    var path = req.file.path;
    var filename = req.file.filename;
    var index;
    var oid;
    var remote;

    var to = usrEnv+"/"+filename;


    extractor(path, {dir: usrEnv}, function (err) {
      if (err) {
        return console.error("error: "+err);
      }

      var ref = req.body.branch;

      repository.refreshIndex().then(function(indexResult){
        index = indexResult;
      }).then(function(){
        return index.addAll();
      }).then(function(){
        return index.write();
      }).then(function(){
        return index.writeTree();
      }).then(function(oidResult){
        oid = oidResult;
        return git.Reference.nameToId(repository, ref);
      }).then(function(head){

        return repository.getCommit(head);
      }).then(function(parent){

        var author = git.Signature.now(username, usermail);
        var committer = git.Signature.now(username, usermail);
        return repository.createCommit("HEAD", author, committer, commitMsg, oid, [parent]);

      }).then(function(commitId) {

          return repository.getRemote("origin");
      }).then(function(remoteResult) {

        remote = remoteResult;

        remote.push(
          [ref+":"+ref],{

            callbacks: {
              credentials: function(url, username) {
                return git.Cred.userpassPlaintextNew("git", "gelgit");
              }
            }

          }).then(function(number) {

            console.log("success:true, details: Pushed ");
            return res.status(200).send({"success":true, "details": "Pushed"});
        });
      });
    });
      });

};
