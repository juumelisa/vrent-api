const Validator = require("validatorjs");
const { uuid } = require("../../helpers");
const { Op } = require("sequelize");
const { state: State, sequelize, city: City } = require("./location.model");
const { getCity } = require("./location.helpers");

City.belongsTo(State, {as: "state", foreignKey: "stateId"})

exports.stateList = async (req, res) => {
  const query = req.query
  let { q, limit = 10, page = 1, order = "name", sort = "asc" } = query
  
  limit = parseInt(limit)
  page = parseInt(page)

  const rules = {
    limit: "integer|min:1|max:100",
    page: "integer|min:1",
    order: "in:name",
    sort: "in:asc,desc"
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
      message: message,
      total: 0,
      limit,
      page,
      result: []
    });
  }

  async function passes() {
    try {
      let orderDetail = [[order, sort]]
      const where = {
        status: 1
      }
      if (q) {
        where.name = {
          [Op.substring]: q
        }
      }

      const offset = (page - 1) * limit
      const stateList = await State.findAndCountAll({
        attributes: ["id", "name", "createdAt", "updatedAt"],
        where,
        order: orderDetail,
        limit,
        offset
      })
      const total = stateList.count
      const result = stateList.rows
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully fetch state",
        total,
        limit,
        page,
        result
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

exports.stateStore = async (req, res) => {
  const body = req.body
  const { name } = body
  
  Validator.registerAsync("checkState", async function (name, attribute, req, passes) {
    const state = await State.findOne({
      where: {
        name,
        status: 1
      }
    })
    if (state) {
      passes (false, "state exist")
    } else {
      passes ()
    }
  })

  const rules = {
    name: "required|checkState"
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
      const stateName = name.trim()

      const params = {
        id: id,
        name: stateName,
        status: 1
      }
      await State.create(params, {transaction: t})

      await t.commit ()
      const result = await State.findOne({
        where: {
          id
        }
      })
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store state",
        result: [result]
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

exports.stateDelete = async (req, res) => {
  const body = req.body
  const { id } = body
  
  Validator.registerAsync("checkState", async function (id, attribute, req, passes) {
    const state = await State.findOne({
      where: {
        id,
        status: 1
      }
    })
    if (state) {
      passes ()
    } else {
      passes (false, "state not exist")
    }
  })

  const rules = {
    id: "required|checkState"
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
      const params = {
        status: 0
      }
      await State.update(params, {
        where: {
          id
        },
        transaction: t
      })

      await t.commit ()
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully delete state",
        result: [result]
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

exports.cityList = async (req, res) => {
  const query = req.query
  let { q, limit = 10, page = 1, order = "name", sort = "asc" } = query
  
  limit = parseInt(limit)
  page = parseInt(page)

  const rules = {
    limit: "integer|min:1|max:100",
    page: "integer|min:1",
    order: "in:name,state,searchCount",
    sort: "in:asc,desc"
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
      message: message,
      total: 0,
      limit,
      page,
      result: []
    });
  }

  async function passes() {
    try {
      let orderDetail = [[order, sort]]
      const where = {
        status: 1
      }
      console.log(q)
      if (q) {
        where.name = {
          [Op.iLike]: `%${q}%`
        }
      }
      if (order === "state") {
        orderDetail = [["state", "name", sort], ["name", sort]]
      }

      const offset = (page - 1) * limit
      const cities = await City.findAndCountAll({
        where,
        order: orderDetail,
        limit,
        offset,
        include: [
          {
            model: State,
            as: "state"
          }
        ]
      })
      const total = cities.count
      const result = getCity(cities.rows)
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully fetch list",
        total,
        limit,
        page,
        result
      })
    } catch (err) {
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

exports.cityStore = async (req, res) => {
  const body = req.body
  const { stateId, name, image } = body
  
  Validator.registerAsync("checkCity", async function (name, attribute, req, passes) {
    const where = {
      name,
      status: 1
    }
    if (stateId) {
      where.stateId = stateId
    }
    const city = await City.findOne({
      where
    })
    if (city) {
      passes (false, "city exist")
    } else {
      passes ()
    }
  })

  Validator.registerAsync("checkState", async function (id, attribute, req, passes) {
    const state = await State.findOne({
      where: {
        id,
        status: 1
      }
    })
    if (state) {
      passes ()
    } else {
      passes (false, "state not exist")
    }
  })

  Validator.registerAsync("checkImage", async function (image, attribute, req, passes) {
    const cloudUrl = process.env.IMAGE_URL
    if (image.startsWith(cloudUrl)) {
      passes ()
    } else {
      passes (false, "invalid url")
    }
  })

  const rules = {
    stateId: "required|checkState",
    name: "required|checkCity",
    image: "url|checkImage"
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
      const cityName = name.trim()

      const params = {
        id: id,
        stateId,
        name: cityName,
        image,
        status: 1
      }
      await City.create(params, {transaction: t})

      await t.commit ()

      const cityDetail = await City.findOne({
        where: {
          id
        },
        include: [
          {
            model: State,
            as: "state"
          }
        ]
      })
      const result = getCity([cityDetail])
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store state",
        result
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

exports.cityDelete = async (req, res) => {
  const body = req.body
  const { id } = body
  
  Validator.registerAsync("checkCity", async function (id, attribute, req, passes) {
    const city = await City.findOne({
      where: {
        id,
        status: 1
      }
    })
    if (city) {
      passes ()
    } else {
      passes (false, "city not exist")
    }
  })

  const rules = {
    id: "required|checkCity"
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
      const params = {
        status: 0
      }
      await City.update(params, {
        where: {
          id
        },
        transaction: t
      })

      await t.commit ()
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully delete city",
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
