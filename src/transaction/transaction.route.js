var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const authAdmin = require("../../middleware/authAdmin")
const controller = require("./transaction.controller");
const { upload } = require('../../middleware/upload');

router.get('/', auth, [auth, authAdmin(['super admin'])], controller.lists);
// router.post('/', [auth, upload.none()], controller.store);
// router.get('/:id', auth, controller.info);

module.exports = router;
