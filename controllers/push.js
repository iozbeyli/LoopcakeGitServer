

exports.bake = function(req,res,next){

  console.log("Push request recieved.");
  console.log(req.file.filename);
  /*if(!req.user._id){
    console.log("success: false, details: Autherization failed.");
    return res.status(401).send({"success":false, "detail": "Autherization failed!"});
  }*/
  var operation = req.body.operation;

  if(!operation){
    console.log("success: false, details: operation was not set!");
    return res.status(200).send({"success":false, "detail": "operation was not set!"});
  }

  if(operation != 1){
    console.log("success: false, details: operation was not set!");
    return res.status(200).send({"success":false, "detail": "operation was not set!"});
  }

  switch(operation) {
    case '1':
      var filename = req.file.filename;
      var path = req.file.path;
      var type = req.file.mimetype;
      var ownermail = req.body.mail;

      var oldimg;
      var ownerid;
      console.log("operation 1 started"+ ownermail);

      User.findOne({"email": ownermail}, {_id: 1, photo: 1}, function (err, docs) {
        if(err){
          console.log("Internal db error");
          console.log(err);
          return res.status(500).send({"success":false, "details": "Internal DB error. Check query!", "error": err});
        }
        console.log("docs: "+docs);
        ownerid = docs._id;
        oldimg = docs.photo;
        console.log("oldimg id: "+ oldimg);

        var read_stream =  fs.createReadStream(path);
        var writeStream = gfs.createWriteStream({
          filename: filename,
          ownerid: ownerid
        });

        read_stream.pipe(writeStream);

        writeStream.on('close', function(file) {
          newimg = file._id;
          console.log("newimg id: "+ newimg);
          writeStream.end();

          if(oldimg){
            console.log("triying to remove "+oldimg);
            gfs.remove({_id: oldimg}, function(err){
              if(err) return console.log(err)
              console.log("ownerid "+ownerid);
              User.update({_id: ownerid}, {$set: {photo: newimg}}, function(err){
                fs.unlink(path);
                return res.status(200).send({"success":true, "detail": "Profile Photo is changed!"});
              });
            });
          }else{
          console.log("ownerid "+ownerid);
          User.update({_id: ownerid}, {$set: {photo: newimg}}, function(err){
            if(err) return console.log(err)
            fs.unlink(path);
            return res.status(200).send({"success":true, "detail": "Profile Photo is changed!"});
          });
        }

        });


      });


      break;
    default:
      console.log("success: false, details: Unknown Operation!");
      return res.status(200).send({"success":false, "detail": "Unknown Operation!"});
      break;
  }

};
