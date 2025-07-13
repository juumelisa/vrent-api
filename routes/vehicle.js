var express = require('express');
var router = express.Router();

const auth = require("../middleware/auth")

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/list', auth, (req, res) => {
  res.status(200).json({
    status: "success",
    code: 200,
    message: ["successfully fetch data"],
    result: []
  })
});

module.exports = router;
