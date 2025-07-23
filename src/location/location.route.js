var express = require('express');
var router = express.Router();

const { upload } = require('../../middleware/upload');
const auth = require("../../middleware/auth")
const controller = require("./location.controller");
const authAdmin = require('../../middleware/authAdmin');

router.post('/province', [auth, authAdmin(), upload.none()], controller.provinceStore);
router.post('/city', [auth, authAdmin(), upload.none()], controller.cityStore);

module.exports = router;
