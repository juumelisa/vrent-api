var express = require('express');
var router = express.Router();
var multer = require('multer');
var router = express.Router();
var upload = multer();

const auth = require('../middleware/auth');
const controller = require('../controller/chat');

router.get('/', [auth, upload.none()], controller.info);

module.exports = router;
