var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./upload.controller");
const { upload } = require('../../middleware/upload');

router.post('/', [auth, upload.single('file')], controller.store);

module.exports = router;
