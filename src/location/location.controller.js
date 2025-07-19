const Validator = require("validatorjs");
const Db = require("./location.model");
const { uuid } = require("../../helpers");
const { Op } = require("sequelize");
const { getCity } = require("./location.helpers");
const City = Db.city
const Province = Db.province

City.belongsTo(Province, {as: 'province', sourceKey: 'provinceId'})

exports.list = async (req, res) => {
  const query = req.query
  let { q, limit = 10, offset = 0, order = 'name', sort = 'asc' } = query

  const rules = {
    q: 'string',
    limit: 'integer|min:1|max:100',
    offset: 'integer|min:0',
    order: 'in:name,province,createdAt,updatedAt',
    sort: 'in:asc,desc'
  }

  let error_msg = {
    in: "invalid :attribute"
  };

  let validation = new Validator(query, rules, error_msg);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
    for (var key in validation.errors.all()) {
      var value = validation.errors.all()[key];
      message.push(value[0]);
    }
    res.status(200).json({
      code: 401,
      status: "error",
      message: message[0],
      offset: offset,
      limit: limit,
      total: 0,
      result: []
    });
  }

  async function passes() {
    try {
      let orderDetail = [[order, sort]]
      limit = parseInt(limit)
      offset = parseInt(offset)
      const where = {}
      if (q) {
        where.name = {
          [Op.substring]: q
        }
      }
      if (order === 'province') {
        orderDetail = [['province', 'name', sort]]
      }
      const cityResult = await City.findAndCountAll({
        attributes: ['id', 'name'],
        where,
        order: orderDetail,
        limit,
        offset,
        include: [
          {
            model: Province,
            as: 'province'
          }
        ]
      })
      const total = cityResult.count
      const cities = cityResult.rows
      const result = getCity(cities)
      res.status(200).json({
        status: "success",
        code: 200,
        limit,
        offset,
        message: "successfully fetch data",
        total,
        result
      })
    } catch (err) {
      const message = err.sql ? 'query syntax error' : err.message
      res.status(200).json({
        status: "success",
        code: 400,
        limit,
        offset,
        message: message,
        result: []
      })
    }
  }
}

exports.store = async (req, res) => {
  const body = req.body
  const { name } = body

  Validator.registerAsync("check_brand", async function (name, attribute, req, passes) {
    const brand = await Brand.findOne({
      where: {
        name,
        status: 1
      }
    })
    if(brand) {
      passes (false, 'brand already exist')
    } else {
      passes ()
    }
  })

  const rules = {
    name: 'required|min:1|max:255|check_brand',
  }

  let error_msg = {
    in: "invalid :attribute"
  };

  let validation = new Validator(body, rules, error_msg);
  validation.checkAsync(passes, fails);

  function fails() {
    let message = []
    for (var key in validation.errors.all()) {
      var value = validation.errors.all()[key];
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
    const t = await Db.sequelize.transaction()
    try{
      const id = uuid()
      const params = {
        id,
        name
      }
      await Brand.create(params, {transaction: t})
      await t.commit()

      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store data",
        result: [params]
      })
    } catch (err) {
      await t.commit()
      const message = err.sql ? "query syntax error" : err.message
      res.status(200).json({
        status: "success",
        code: 400,
        message: message,
        result: []
      })
    }
  }
}