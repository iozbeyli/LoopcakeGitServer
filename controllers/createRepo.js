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
  console.log("Repo-Create request is received.");
  console.log(req.body);
  var isBare = 0;
  var user = req.body.user;
  var repo = req.body.repo;
  var name = req.body.name;
  var email = req.body.email;
  var message = req.body.message;
  var members = req.body.members;
  //var remoteEnv = path.resolve("/home/git/repos/remotes/"+repo+"/");
  var remote = path.resolve("/home/git/repos/remotes/"+repo+"/");


  fse.ensureDir(remote, function(err) {
    if(err)
      console.log(err)

    git.Repository.init(remote, 0)
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
      var author = git.Signature.now(name,
        email);
      var committer = git.Signature.now(name,
        email);

      // Since we're creating an inital commit, it has no parents. Note that unlike
      // normal we don't get the head either, because there isn't one yet.
      return repository.createCommit("HEAD", author, committer, message, oid, []);
    })
    .done(function(commitId) {

        git.Clone(remote, remote+".git", {bare:1})
        .then(function(repo) {
          git.Remote.create(repository, "origin", "git@localhost:"+remote+".git");
        })
        .then(function () {

            if (err) return console.error(err)
            console.log('removed creator git env!')
            var count = members.length;
            members.forEach(function (member) {
              console.log("cloning for "+member);
              console.log("repo "+repo);
              usrEnv = path.resolve("/home/git/repos/users/"+member+"/"+repo+"/");
                console.log("ensured "+member);
                if(err) console.log(err);
                git.Clone.clone ("git@localhost:"+remote+".git", usrEnv, {
                  bare:0,
                  fetchOpts: {
                    callbacks: {
                      credentials: function(url, username) {
                        return git.Cred.userpassPlaintextNew("git", "gelgit");
                      },

                      certificateCheck: function(){
                        return 1;
                      }
                    }
                  }

                })
                .then(function(repoOB) {
                  console.log("creating origin for "+member);
                  git.Remote.create(repoOB, "origin", "git@localhost:"+remote+".git");
                  count--;
                  console.log("count "+count);
                  if(count ==0){
                    console.log("success: true, details: New Repo Created.");
                    return res.status(200).send({"success":true, "details": "New Repo Created."});
                  }

                })


          })
        });
    });
  });


};
