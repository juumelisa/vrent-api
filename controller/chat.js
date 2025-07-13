const axios = require("axios");
const { generateToken, uuid } = require("../helpers");
const { token } = require("../model/token");
const { sequelize } = require("../config/db.config");

exports.info = async (req, res) => {
  let { token: tokenUser } = req.headers
  const t = await sequelize.transaction()
  try {
    
    const systemMessage =  "You are Vira an assistant for vehicle rental websit called VRent. Please provide simple, not too long and polite answers."
    const response = await axios.post('http://localhost:11434/api/chat', {
      stream: false,
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: "user",
          content: 'hi!'
        }
      ],
    });

    const resultData = {
      ...response.data.message
    }

    if (!tokenUser) {
      const tokenUser = generateToken()
      
      resultData.token = tokenUser

      const currentDate = new Date ()
      const in30Days = currentDate.setDate(currentDate.getDate() + 30);

      const params_token = {
        id: uuid(0),
        user_id: uuid(1),
        token: tokenUser,
        expired_date: in30Days
      }

      await token.create(params_token, {transaction: t})
    }
    await t.commit()
    res.status(200).json({
      status: "success",
      code: 200,
      message: ["Successfully connect to agent"],
      result: [resultData],
    });
  } catch (err) {
    await t.rollback()
    console.log(err)
    res.status(200).json({
      status: "error",
      code: 400,
      message: ['Failed to connect to agent'],
      result: [],
    });
  }
}