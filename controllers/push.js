const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
var ncp = require("ncp");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));

exports.bake = function(req,res,next){

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

      return repository.fetch(remoteName);
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function() {
    return repository.mergeBranches(branch, remoteBranch);
  })
  .done(function() {
    console.log("pull Done!");

    var path = req.file.path;
    var filename = req.file.filename;
    var index;
    var oid;
    var remote;
    console.log("Copying from: "+path);
    console.log("To: "+usrEnv);
    console.log(req.file.filename);
    console.log(usrEnv+"/"+filename);
    var to = usrEnv+"/"+filename;
    console.log(to);

    //ncp.limit = 16;

    ncp(path, to, function (err) {
      if (err) {
        return console.error("error: "+err);
      }
      console.log('Copied!');

      var ref = "refs/heads/master";
      console.log('Pushing!');

      repository.refreshIndex().then(function(indexResult){
        console.log('index result: '+ indexResult);
        index = indexResult;
      }).then(function(){
        return index.addByPath(filename);
      }).then(function(){
        console.log('add by path');
        return index.write();
      }).then(function(){
        console.log('write done');
        return index.writeTree();
      }).then(function(oidResult){
        oid = oidResult;
        console.log('write tree done oid: '+ oid);
        return git.Reference.nameToId(repository, "HEAD");
      }).then(function(head){
        console.log('head result: '+ head);
        return repository.getCommit(head);
      }).then(function(parent){
        console.log('parent result: '+ parent);
        var author = git.Signature.now("Scott Chacon",
          "schacon@gmail.com");
        var committer = git.Signature.now("Scott A Chacon",
          "scott@github.com");
        return repository.createCommit("HEAD", author, committer, "message", oid, [parent]);

      }).then(function(commitId) {
          console.log("New Commit: ", commitId);
          return repository.getRemote("origin");
      }).then(function(remoteResult) {
        console.log('remote Loaded '+  remoteResult);
        remote = remoteResult;
        return remote.connect(git.Enums.DIRECTION.PUSH);
      }).then(function() {
        console.log('remote Connected?', remote.connected())
        return remote.push(
          ["refs/heads/master:refs/heads/master"])
        }).then(function() {
          console.log('remote Pushed!')
          console.log("It worked!");
          return res.status(200).send({"success":true, "details": "It worked!"});
        });
      });

          });



};
