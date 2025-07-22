const Validator = require("validatorjs");
const { user: User, token: Token, sequelize } = require("./user.model");
const { hashing, uuid, generateToken, comparePassword } = require("../../helpers");

exports.store = async (req, res) => {
  const body = req.body
  const { name, email, password } = body
  
  Validator.registerAsync("check_email", async function (name, attribute, req, passes) {
    const user = await User.findOne({
      where: {
        email,
        status: 1
      }
    })
    if (user) {
      passes (false, 'user exist')
    } else {
      passes ()
    }
  })

  const rules = {
    name: "required|max:255",
    email: "required|email|max:255|check_email",
    password: ["required", "regex:/^(?=.*[A-Z])(?=.*\\d).{8,}$/"]
  }

  let errorMessage = {
    in: "invalid :attribute"
  };

  let validation = new Validator(body, rules, errorMessage);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
    console.log(validation.errors.all())
    for (const key in validation.errors.all()) {
      const value = validation.errors.all()[key];
      message.push(value[0]);
    }
    res.status(200).json({
      code: 400,
      status: "error",
      message: message,
      result: []
    });
  }

  async function passes() {
    const t = await sequelize.transaction()
    try {
      const id = uuid()
      const hashPassword = await hashing(password)

      const trimName = name.trim()
      const params = {
        id: id,
        name: trimName,
        email: email,
        password: hashPassword
      }
      await User.create(params, {transaction: t})

      // should send email
      await t.commit ()
      res.status(200).json({
        status: "success",
        code: 200,
        message: "register success",
        result: []
      })
    } catch (err) {
      await t.rollback ()
      const message = err.sql ? "internal server error" : err.message
      res.status(200).json({
        status: "error",
        code: 400,
        message: message,
        result: []
      })
    }
  }
}

exports.login = async (req, res) => {
  const body = req.body
  const { email, password } = body
  
  const rules = {
    email: "required|email",
    password: ["required"]
  }

  let errorMessage = {
    in: "invalid :attribute"
  };

  let validation = new Validator(body, rules, errorMessage);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
    console.log(validation.errors.all())
    for (const key in validation.errors.all()) {
      const value = validation.errors.all()[key];
      message.push(value[0]);
    }
    res.status(200).json({
      code: 400,
      status: "error",
      message: message[0],
      result: []
    });
  }

  async function passes() {
    const t = await sequelize.transaction()
    try {
      const user = await User.findOne({
        where: {
          email,
          status: 1
        }
      })
      console.log(email)
      if (user) {
        const hashPassword = user.password
        const isPasswordMatch = await comparePassword(password, hashPassword)
        if (isPasswordMatch) {
          const token = generateToken()
          const id = uuid()
          const userId = user.id

          const currentDate = new Date ()
          const expiredDate = new Date (currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          const params = {
            id,
            userId,
            token,
            expiredDate
          }

          const wheresDestroy = {
            userId
          }
          await Token.destroy({
            where: wheresDestroy,
            transaction: t
          })
          await Token.create(params, {transaction: t})
          await t.commit ()
          const result = [{
            token
          }]
          res.status(200).json({
            status: "success",
            code: 200,
            message: "login success",
            result
          })
        } else {
          await t.rollback()
          res.status(200).json({
            status: "error",
            code: 401,
            message: "invalid credential",
            result: []
          })
        }
      } else {
        await t.rollback()
        res.status(200).json({
          status: "error",
          code: 401,
          message: "invalid credential",
          result: []
        })
      }
    } catch (err) {
      await t.rollback ()
      const message = err.sql ? "internal server error" : err.message
      res.status(200).json({
        status: "error",
        code: 400,
        message: message,
        result: []
      })
    }
  }
}