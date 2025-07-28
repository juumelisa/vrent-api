var express = require('express');
var router = express.Router();

const { upload } = require('../../middleware/upload');
const auth = require("../../middleware/auth")
const controller = require("./brand.controller");
const authAdmin = require('../../middleware/authAdmin');

router.get('/', auth, controller.list);
router.post('/', [auth, authAdmin(), upload.none()], controller.store);

module.exports = router;
