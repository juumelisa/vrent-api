var express = require('express');
var router = express.Router();
/* GET home page. */

var axios = require('axios');
const { vehicle } = require('../model/vehicle');
const { Op } = require('sequelize');
const { faq } = require('../model/faq');
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// router.post('/chat', async function(req, res, next) {
//   const { messages } = req.body;

//   try {
//     console.log(messages)
//     // const faqList = await faq.findAll({
//     const systemMessage =  `You are Vira an assistant for vehicle rental website. Your job is to help users about rental and services. Please answer politely. If users ask anything unrelated, don't answer!`
//     const response = await axios.post('http://localhost:11434/api/chat', {
//       stream: false,
//       model: 'mistral',
//       messages: [
//         {
//           role: 'system',
//           content: systemMessage
//         },
//         {
//           role: "user",
//           content: messages || 'hi!'
//         },
//       ],
//     });
//     res.status(200).json({
//       status: "success",
//       code: 200,
//       message: ["successfully send message"],
//       result: [
//         response.data.message
//       ]
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       code: 400,
//       message: ['Failed to connect to Ollama'],
//       result: [],
//     });
//   }
// });

module.exports = router;
