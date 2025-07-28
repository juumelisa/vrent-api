var express = require('express')
var router = express.Router()

const { upload } = require('../../middleware/upload')
const auth = require("../../middleware/auth")
const {
  stateList,
  stateStore,
  cityStore,
  cityList,
  stateDelete,
  cityDelete
} = require("./location.controller")
const authAdmin = require('../../middleware/authAdmin')

router.get('/state', auth, stateList)
router.post('/state', [auth, authAdmin(), upload.none()], stateStore)
router.delete('/state', [auth, authAdmin(), upload.none()], stateDelete)

router.get('/city', auth, cityList)
router.post('/city', [auth, authAdmin(), upload.none()], cityStore)
router.delete('/city', [auth, authAdmin(), upload.none()], cityDelete)

module.exports = router
