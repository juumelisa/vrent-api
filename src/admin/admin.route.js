var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./vehicles.controller");
const { upload } = require('../../middleware/upload');

// router.get('/vehicles', auth, controller.list);
router.post('/vehicles', [auth, upload.none()], controller.store);

module.exports = router;
