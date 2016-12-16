const express = require('express');
const multer  = require('multer')
const auth = require('./controllers/authentication');
const push = require('./controllers/push');
const pull = require('./controllers/pull');
const create = require('./controllers/createRepo');
const branchController = require('./controllers/branchController');
const fileController = require('./controllers/fileController');
const commitController = require('./controllers/commitController');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, __dirname+'/uploads/');
  },
  filename: function(req, file, cb){

    cb(null, file.originalname);
  }

});
var upload = multer({
  storage: storage
});


module.exports = function(app) {
  const apiRoutes = express.Router();

  //routes will go here
  apiRoutes.post('/push', upload.single("file"), push.bake);
  apiRoutes.post('/create', create.create);
  apiRoutes.get('/pull', pull.serve);
  apiRoutes.post('/list', fileController.getContentList);
  apiRoutes.post('/getFileContent', fileController.getFileContent);
  apiRoutes.post('/getHistory', commitController.getHistory);
  apiRoutes.post('/createBranch', branchController.create);
  apiRoutes.post('/showBranch', branchController.showBranch);
  apiRoutes.post('/checkout', branchController.checkout);
  app.use('/api', apiRoutes);
}
