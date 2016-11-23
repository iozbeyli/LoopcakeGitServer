const git = require("nodegit");
var path = require("path");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var fileName = "readme.md";
var fileContent = "This is your readme!";

fse.ensureDir = promisify(fse.ensureDir);

var repository;
var index;



exports.create = function(req,res,next){

  var isBare = 0;
  var user = req.body.user;
  var repo = req.body.repo;
  var usrEnv = path.resolve("../repos/users/"+user+"/"+repo+"/");
  var remote = path.resolve("../repos/remotes/"+repo+"/");


  fse.ensureDir(usrEnv, function(err) {
    if(err)
      console.log(err)

    git.Repository.init(usrEnv, 0)
    .then(function(repo) {
      repository = repo;
      return fse.writeFile(path.join(repository.workdir(), fileName), fileContent);
    })
    .then(function(){
      return repository.refreshIndex();
    })
    .then(function(idx) {
      index = idx;
    })
    .then(function() {
      return index.addByPath(fileName);
    })
    .then(function() {
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    })
    .then(function(oid) {
      var author = git.Signature.now("Scott Chacon",
        "schacon@gmail.com");
      var committer = git.Signature.now("Scott A Chacon",
        "scott@github.com");

      // Since we're creating an inital commit, it has no parents. Note that unlike
      // normal we don't get the head either, because there isn't one yet.
      return repository.createCommit("HEAD", author, committer, "message", oid, []);
    })
    .done(function(commitId) {
      console.log("New Commit: ", commitId);

        git.Clone(usrEnv, remote+".git", {bare:1})
        .then(function(repo) {
          git.Remote.create(repository, "origin", "git@localhost:"+remote+".git");
          console.log("success: true, details: something happened.");
          return res.status(200).send({"success":true, "details": "something happened."});
        });
    });
  });


};
