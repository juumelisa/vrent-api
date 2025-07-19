var express = require('express');
var router = express.Router();
var multer = require('multer');
var router = express.Router();
var upload = multer();

const auth = require('../middleware/auth');
const authUser = require('../middleware/authUser');
const controller = require('../controller/chat');

router.get('/', [auth], controller.info);
router.post('/store', [auth, authUser, upload.none()], controller.store);

module.exports = router;
