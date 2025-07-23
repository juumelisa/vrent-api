const Validator = require("validatorjs");
const { uuid } = require("../../helpers");
const { Op } = require("sequelize");
const { province: Province, sequelize, city: City } = require("./location.model");

exports.provinceStore = async (req, res) => {
  const body = req.body
  const { name } = body
  
  Validator.registerAsync("checkProvince", async function (name, attribute, req, passes) {
    const province = await Province.findOne({
      where: {
        name,
        status: 1
      }
    })
    if (province) {
      passes (false, "province exist")
    } else {
      passes ()
    }
  })

  const rules = {
    name: "required|checkProvince"
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
      const provinceName = name.trim()

      const params = {
        id: id,
        name: provinceName,
        status: 1
      }
      await Province.create(params, {transaction: t})

      await t.commit ()
      const result = await Province.findOne({
        where: {
          id
        }
      })
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store province",
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

exports.cityStore = async (req, res) => {
  const body = req.body
  const { provinceId, name } = body
  
  Validator.registerAsync("checkCity", async function (name, attribute, req, passes) {
    const where = {
      name,
      status: 1
    }
    if (provinceId) {
      where.provinceId = provinceId
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

  Validator.registerAsync("checkProvince", async function (id, attribute, req, passes) {
    const province = await Province.findOne({
      where: {
        id,
        status: 1
      }
    })
    if (province) {
      passes ()
    } else {
      passes (false, "province not exist")
    }
  })

  const rules = {
    provinceId: "required",
    name: "required|checkCity"
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
        provinceId,
        name: cityName,
        status: 1
      }
      await City.create(params, {transaction: t})

      await t.commit ()

      const result = await City.findOne({
        where: {
          id
        },
        // include: [
          // {
          //   model: Province,

          // }
        // ]
      })
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store province",
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
