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
      return commitOnBranch.getTree();
  })
  .then(function(tree) {
    // `walk()` returns an event.
    var blobsOnly = false;
    var walker = tree.walk();
    var result = [];
    var trees;
    walker.on("end", function(final) {
      console.log(final);
      trees = final;
      console.log(trees.length);

      for(i=0; i<trees.length ; i++){
        entryPath = trees[i].path();
        console.log("path: "+entryPath);
        result.push(entryPath);
      }
      var output = [];

      for (var i = 0; i < result.length; i++) {
        var chain = result[i].split(path.sep);
        console.log("path: "+chain);
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
      console.log("success: true, details: "+output);
      return res.status(200).send({"success":true, "details": output});
      });


    // Don't forget to call `start()`!
    walker.start();

  });
}

exports.getContentList = function(req,res,next){

  console.log("getFileContent request recieved.");
  console.log(req.body);
  var user = req.body.user;
  var repo = req.body.repo;
  var filePath = req.body.path;
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
      return "/home/git/repos/users/"+user+"/"+repo+"/"+filePath;
  })
  // Now that we're finished fetching, go ahead and merge our local branch
  // with the new one
  .then(function(file) {
    fs.readFile(file, function (err, data) {
      if(err)
        console.log(err) // => null
      else
        console.log(data);
      // file has now been created, including the directory it is to be placed in

    });
  });

}
