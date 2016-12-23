const git = require("nodegit");
var path = require("path");
var open = git.Repository.open;

exports.getHistory = function(req,res,next){

  console.log("getHistory request recieved.");
  console.log(req.body);
  var user = req.body.user;
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
    var branch = currentBranch.name().split("/");
    branch = branch[branch.length-1];
    var remoteBranch = remoteName + '/' + branch;
    repository.mergeBranches(branch, remoteBranch);
    return repository.getReferences(git.Reference.TYPE.OID);
  })
  .then(function(refs) {

    var allHistory = [];
    var branches = [];
    var count = refs.length;
    refs.forEach(function(ref){
      if(!ref.isRemote()){
        branches.push(ref.name());
      var historyOfOne = [];
      var commit = repository.getBranchCommit(ref);

      commit.then(function (result) {
          var eventEmitter = result.history();

          eventEmitter.on('commit', function(commit) {
            historyOfOne.unshift({"sha":commit.sha(),
                            "message":commit.message(),
                            "time":commit.date(),
                            "branch": [ref.name()]});

            });
          eventEmitter.on('end', function(commits) {
            allHistory.push(historyOfOne);
            count--;

            if(count == 0){
              var output = [];

              for (var i = 0; i < allHistory.length; i++) {
                var chain = allHistory[i];
                var currentNode = output;
                for (var j = 0; j < chain.length; j++) {
                  var wantedNode = chain[j];
                  var lastNode = currentNode;
                  for (var k = 0; k < currentNode.length; k++) {
                    if (currentNode[k].log.sha == wantedNode.sha) {
                        currentNode[k].log.branch.push(wantedNode.branch[0]);
                        currentNode = currentNode[k].children;
                        break;
                    }
                  }
                  // If we couldn't find an item in this list of children
                  // that has the right name, create one:
                  if (lastNode == currentNode) {
                    var newNode = currentNode[k] = {log: wantedNode, children: []};
                    currentNode = newNode.children;
                  }
                }
              }
              console.log("success: true, details: history");
              return res.status(200).send({"success":true, "details": output, "branches": branches});
          }
          });
          eventEmitter.on('error', function(error) {
            console.log("error");
            console.log(error);
          });
          eventEmitter.start()
        }).catch(e => {
          console.log("error")
          console.log(e)
        });
      }else{
        count--;
      }
    })

  })
}
