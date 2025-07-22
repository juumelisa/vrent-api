const Validator = require("validatorjs");
const { user: User, token: Token, sequelize } = require("./user.model");
const { hashing, uuid, generateToken, comparePassword } = require("../../helpers");
const { getUser } = require("./user.helpers");
const { Op } = require("sequelize");

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

exports.list = async (req, res) => {
  const query = req.query
  let { q, limit = 10, page = 1, order = "name", sort = "asc" } = query
  
  limit = parseInt(limit)
  page = parseInt(page)
  
  const rules = {
    order: "in:name,email,createdAt,updatedAt",
    sort: "in:asc,desc",
    limit: "integer|min:1|max:100",
    page: "integer|min:1"
  }

  let errorMessage = {
    in: "invalid :attribute"
  };

  let validation = new Validator(query, rules, errorMessage);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
    for (const key in validation.errors.all()) {
      const value = validation.errors.all()[key];
      message.push(value[0]);
    }
    res.status(200).json({
      code: 400,
      status: "error",
      message: message[0],
      page,
      limit,
      total: 0,
      result: []
    });
  }

  async function passes() {
    try {
      const where = {
        status: 1
      }
      if (q) {
        where[Op.or] = {
          name: {[Op.substring]: q},
          email: {[Op.substring]: q}
        }
      }
      const offset = (page - 1) * limit
      const user = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [[order, sort]]
      })
      
      const total = user.count
      const result = getUser(user.rows)
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully fetch data",
        page,
        limit,
        total,
        result
      })
    } catch (err) {
      const message = err.sql ? "internal server error" : err.message
      res.status(200).json({
        status: "error",
        code: 500,
        message: message,
        page,
        limit,
        total: 0,
        result: []
      })
    }
  }
}

exports.info = async (req, res) => {
  const params = req.params
  let { id } = params
  
  const rules = {
    id: "required"
  }

  let errorMessage = {
    in: "invalid :attribute"
  };

  let validation = new Validator(params, rules, errorMessage);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
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
    try {
      const where = {
        id,
        status: 1
      }
      const user = await User.findOne({
        where
      })
      if (user) {
        const result = getUser([user])
        res.status(200).json({
          status: "success",
          code: 200,
          message: "successfully fetch data",
          result
        })
      } else {
        res.status(200).json({
          status: "error",
          code: 404,
          message: "data not found",
          result: []
        })
      }
    } catch (err) {
      const message = err.sql ? "internal server error" : err.message
      res.status(200).json({
        status: "error",
        code: 500,
        message: message,
        result: []
      })
    }
  }
}