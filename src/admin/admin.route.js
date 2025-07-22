var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./admin.controller");
const { upload } = require('../../middleware/upload');

router.post('/', [auth, upload.none()], controller.store);
router.post('/login', [auth, upload.none()], controller.login);

module.exports = router;
