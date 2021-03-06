const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));

exports.getContentList = function(req,res,next){

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

    repository.mergeBranches(branch, remoteBranch);
    return repository.getHeadCommit();
  })
  .then(function(commitOnBranch) {
      return commitOnBranch.getTree();
  })
  .then(function(tree) {
    // `walk()` returns an event.
    var blobsOnly = false;
    var walker = tree.walk();
    var result = [];
    var trees;
    walker.on("end", function(final) {
      trees = final;

      for(i=0; i<trees.length ; i++){
        entryPath = trees[i].path();
        result.push(entryPath);
      }
      var output = [];
      for (var i = 0; i < result.length; i++) {
        var chain = result[i].split(path.sep);
        var currentNode = output;
        for (var j = 0; j < chain.length; j++) {
          var wantedNode = chain[j];
          var lastNode = currentNode;
          for (var k = 0; k < currentNode.length; k++) {
            if (currentNode[k].name == wantedNode) {
                currentNode = currentNode[k].children;
                break;
            }
          }
          // If we couldn't find an item in this list of children
          // that has the right name, create one:
          if (lastNode == currentNode) {
            var newNode = currentNode[k] = {name: wantedNode, children: []};
            currentNode = newNode.children;
          }
        }
      }
      var head = repository.getHeadCommit();
      head.then(
        function successHandler(com) {
          var branch = repository.getCurrentBranch();
          branch.then(
            function successHandler(bran) {
            console.log("success: true, details: ContentList");
            return res.status(200).send({"success":true, "details": output, "head":com.sha(), "branch":bran.name()});
            },
            function failureHandler(error) {
              console.log(error);
            }
          );

        },
        function failureHandler(error) {
          console.log(error);
        });
      });
    walker.start();

  });
}

exports.getFileContent = function(req,res,next){

  console.log("getFileContent request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repoRef = req.body.repo;
  var filePath = req.body.path;
  var remoteName = 'origin';
  var branch = 'master';
  var repository;
  var remoteBranch = remoteName + '/' + branch;
  var usrEnv = path.resolve("/home/git/repos/users/"+user+"/"+repoRef+"/");
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
      return "/home/git/repos/users/"+user+"/"+repoRef+"/"+filePath;
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function(file) {
    fse.readFile(file, "utf-8", function (err, data) {
      var response = {path: null, data: null};
      response.path = filePath.split(path.sep);;
      response.data = data;
      if(err){
        console.log(err) // => null
      }else{
        if(response){
          console.log("success: true, details: "+response);
          return res.status(200).send({"success":true, "details": response});
        }else {
          console.log("couldnt read");
        }
     }
      // file has now been created, including the directory it is to be placed in

    });
  });

}
