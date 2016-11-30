const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./router');

app.use(bodyParser.json());
app.use(cors());
router(app);


app.listen(9500);
