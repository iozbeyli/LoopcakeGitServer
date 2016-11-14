

exports.auth = function(req,res,next){

  console.log("success: true, details: something happened.");
  return res.status(200).send({"success":true, "details": "something happened."});

};
