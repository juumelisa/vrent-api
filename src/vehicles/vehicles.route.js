var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./vehicles.controller");
const { upload } = require('../../middleware/upload');

router.get('/', auth, controller.lists);
router.post('/', [auth, upload.none()], controller.store);
// router.get('/:id', auth, controller.info);

module.exports = router;
