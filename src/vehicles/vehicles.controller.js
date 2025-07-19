const Validator = require("validatorjs");
const { vehicle: Vehicle, vehicleImage: VehicleImage } = require("./vehicles.model");
const { city: City, province: Province } = require("../location/location.model");
const { brand: Brand } = require("../brand/brand.model");
const { getVehicle } = require("./vehicles.helpers");
const { Op } = require("sequelize");

Vehicle.hasMany(VehicleImage, {as: 'images', foreignKey: 'vehicleId'})
Vehicle.belongsTo(City, {as: 'city', foreignKey: 'locationId'})
Vehicle.belongsTo(Brand, {as: 'brand', foreignKey: 'brandId'})

exports.list = async (req, res) => {
  const query = req.query
  let { q, limit = 10, offset = 0, order = 'name', sort = 'asc' } = query

  const rules = {
    q: 'string',
    limit: 'integer|min:1|max:100',
    offset: 'integer|min:0',
    order: 'in:name,createdAt,updatedAt',
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
      code: 400,
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
      limit = parseInt(limit)
      offset = parseInt(offset)
      const where = {}
      if (q) {
        where[Op.or] = {
          model: q
        }
      }
      let orderList = [[order, sort]]
      if (order === 'name') {
        orderList = [['brand', 'name', sort], ['model', sort]]
      }
      const vehicles = await Vehicle.findAndCountAll({
        distinct: true,
        limit,
        offset,
        order: orderList,
        include: [
          {
            model: Brand,
            as: 'brand'
          },
          {
            model: City,
            as: 'city',
            include: [
              {
                model: Province,
                as: 'province'
              }
            ]
          },
          {
            model: VehicleImage,
            as: 'images'
          }
        ]
      })
      const total = vehicles.count
      const vehicleList = vehicles.rows
      const result = getVehicle(vehicleList)
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
      res.status(200).json({
        status: "error",
        code: 400,
        message: err.message,
        result: []
      })
    }
  }
}

exports.info = async (req, res) => {
  console.log(req)
  const { id } = req.params
  // let { q, limit = 10, offset = 0, order = 'name', sort = 'asc' } = query

  const rules = {
    // q: 'string',
    // limit: 'integer|min:1|max:100',
    // offset: 'integer|min:0',
    // order: 'in:name,createdAt,updatedAt',
    // sort: 'in:asc,desc'
  }

  let error_msg = {
    in: "invalid :attribute"
  };

  let validation = new Validator(req.params, rules, error_msg);
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
    try {
      const where = {
        id,
        status: {
          [Op.ne]: 0
        }
      }
      const vehicle = await Vehicle.findOne({
        where,
        include: [
          {
            model: Brand,
            as: 'brand'
          },
          {
            model: City,
            as: 'city',
            include: [
              {
                model: Province,
                as: 'province'
              }
            ]
          },
          {
            model: VehicleImage,
            as: 'images'
          }
        ]
      })
      if (vehicle) {
        const result = getVehicle([vehicle])
        res.status(200).json({
          status: "success",
          code: 200,
          message: "successfully fetch data",
          result
        })
      } else {
        res.status(200).json({
          status: "success",
          code: 404,
          message: "data not found",
          result: []
        })
      }
    } catch (err) {
      res.status(200).json({
        status: "error",
        code: 400,
        message: err.message,
        result: []
      })
    }
  }
}