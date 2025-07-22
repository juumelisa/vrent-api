var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./admin.controller");
const { upload } = require('../../middleware/upload');
const authAdmin = require('../../middleware/authAdmin');

router.get('/', [auth, authAdmin(['super admin'])], controller.list);
router.get('/:id', [auth, authAdmin(['super admin'])], controller.info);
router.post('/', [auth, authAdmin(['super admin']), upload.none()], controller.store);
router.post('/login', [auth, upload.none()], controller.login);

module.exports = router;
