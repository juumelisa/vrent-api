const Validator = require("validatorjs");
const { vehicle } = require("../vehicles/vehicles.model");
const { Op } = require("sequelize");

exports.list = (req, res) => {
  const query = req.query
  const { q, location, limit = 10, offset = 0 } = query

  const rules = {
    q: 'string',
    limit: 'integer|min:1|max:100',
    offset: 'integer|min:0'
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
    const where = {}
    const andQuery = []
    if (q) {
      andQuery.push({
        name: {
          [Op.substring]: q
        },
        brand: {
          [Op.substring]: q
        }
      })
    }
    if (location) {
      andQuery.push({
        location: location
      })
    }
    where[Op.and] = andQuery
    const vehicles = await vehicle.findAll({
      where,
      limit,
      offset
    })
    res.status(200).json({
      status: "success",
      code: 200,
      message: "successfully fetch data",
      result: vehicles
    })
  }
}

exports.store = async (req, res) => {
  const body = req.body
  body.filePath = req.file.path
  console.log(body.filePath)
  res.status(200).json({
    status: "success",
    code: 200,
    message: "ok",
    result: []
  })
  // const { q, location, limit = 10, offset = 0 } = query

  // const rules = {
  //   q: 'string',
  //   limit: 'integer|min:1|max:100',
  //   offset: 'integer|min:0'
  // }

  // let error_msg = {
  //   in: "invalid :attribute"
  // };

  // let validation = new Validator(query, rules, error_msg);
  // validation.checkAsync(passes, fails);

  // function fails() {
  //   let message = []
  //   for (var key in validation.errors.all()) {
  //     var value = validation.errors.all()[key];
  //     message.push(value[0]);
  //   }
  //   res.status(200).json({
  //     code: 401,
  //     status: "error",
  //     message: message[0],
  //     offset: offset,
  //     limit: limit,
  //     total: 0,
  //     result: []
  //   });
  // }

  // async function passes() {
  //   const where = {}
  //   const andQuery = []
  //   if (q) {
  //     andQuery.push({
  //       name: {
  //         [Op.substring]: q
  //       },
  //       brand: {
  //         [Op.substring]: q
  //       }
  //     })
  //   }
  //   if (location) {
  //     andQuery.push({
  //       location: location
  //     })
  //   }
  //   where[Op.and] = andQuery
  //   const vehicles = await vehicle.findAll({
  //     where,
  //     limit,
  //     offset
  //   })
  //   res.status(200).json({
  //     status: "success",
  //     code: 200,
  //     message: "successfully fetch data",
  //     result: vehicles
  //   })
  // }
}