var express = require('express');
var router = express.Router();

const auth = require("../../middleware/auth")
const controller = require("./vehicles.controller")

router.get('/', auth, controller.list);

module.exports = router;
