var express = require('express')
var router = express.Router()

const { upload } = require('../../middleware/upload')
const auth = require("../../middleware/auth")
const {
  provinceList,
  provinceStore,
  cityStore,
  cityList,
  provinceDelete,
  cityDelete
} = require("./location.controller")
const authAdmin = require('../../middleware/authAdmin')

router.get('/province', auth, provinceList)
router.post('/province', [auth, authAdmin(), upload.none()], provinceStore)
router.delete('/province', [auth, authAdmin(), upload.none()], provinceDelete)

router.get('/city', auth, cityList)
router.post('/city', [auth, authAdmin(), upload.none()], cityStore)
router.delete('/city', [auth, authAdmin(), upload.none()], cityDelete)

module.exports = router
