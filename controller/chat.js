const axios = require("axios");
const { generateToken, uuid } = require("../helpers");
const { token } = require("../model/token");
const { sequelize } = require("../config/db.config");
const { chat } = require("../model/chat");

exports.info = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const tokenUser = generateToken()

    const currentDate = new Date ()
    const in30Days = currentDate.setDate(currentDate.getDate() + 30);

    const params_token = {
      id: uuid(0),
      user_id: uuid(1),
      token: tokenUser,
      expired_date: in30Days
    }

    await token.create(params_token, {transaction: t})
    const userId = params_token.user_id

    const systemMessage =  `You are a helpful assistant for a vehicle rental service. You only answer questions related to rental products, services, pricing, delivery, or company policies. 
Your answer should only related to our business. If users ask about anything unrelated, don't answer them.`
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: "user",
        content: 'hi!'
      }
    ]
    const response = await axios.post('http://localhost:11434/api/chat', {
      stream: false,
      model: 'mistral',
      messages
    });

    const resultData = {
      ...response.data.message
    }
    resultData.token = tokenUser
    messages.push(response.data.message)
    const params_chat = []
    Object.values(messages).forEach((message, index) => {
      const id = uuid(index)
      const params = {
        id,
        user_id: userId,
        role: message.role,
        message: message.content
      }
      params_chat.push(params)
    })
    await chat.bulkCreate(params_chat, {transaction: t})
    await t.commit()
    res.status(200).json({
      status: "success",
      code: 200,
      message: ["Successfully connect to agent"],
      result: [resultData],
    });
  } catch (err) {
    await t.rollback()
    res.status(200).json({
      status: "error",
      code: 400,
      message: ['Failed to connect to agent'],
      result: [],
    });
  }
}


exports.store = async (req, res) => {
  const { message } = req.body
  const { userId } = req.session
  const t = await sequelize.transaction()
  try {
    const systemMessage =  "You are a virtual assistant for vehicle rental website called VRent. If users ask questions unrelated to our vehicle rent services, please refuse to answer and don't give any information"

    const messages = [
      {
        role: 'system',
        content: systemMessage
      }
    ]

    const oldChat = await chat.findAll(
      {
        limit: 6,
        order: [['created_at', 'desc']]
      }
    )
    oldChat.reverse()
    console.log(oldChat)
    Object.values(oldChat).forEach(chat => {
      const obj = {
        role: chat.role,
        content: chat.message
      }
      messages.push(obj)
    })
    const currentMessage = [{
      role: 'user',
      content: message
    }]
    messages.push(...currentMessage)

    console.log(messages)
    const response = await axios.post('http://localhost:11434/api/chat', {
      stream: false,
      model: 'mistral',
      messages
    });

    const responseMessage = response.data.message
    currentMessage.push(response.data.message)

    const params_message = []
    Object.values(currentMessage).forEach((chat, index) => {
      const id = uuid(index)
      const obj = {
        id,
        user_id: userId,
        role: chat.role,
        message: chat.content
      }
      params_message.push(obj)
      if(chat.role === 'assistant') {
        responseMessage.id = id
      }
    })
    await chat.bulkCreate(params_message, {transaction: t})
    await t.commit()
    res.status(200).json({
      status: "success",
      code: 200,
      message: ["Successfully connect to agent"],
      result: [responseMessage],
    });
  } catch (err) {
    await t.rollback()
    console.log(err)
    res.status(200).json({
      status: "error",
      code: 400,
      message: ['Failed connect to agent'],
      result: [],
    });
  }
}