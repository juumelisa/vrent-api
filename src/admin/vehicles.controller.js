const Validator = require("validatorjs");
const { vehicle, vehicleImage: VehicleImage, sequelize, vehicleImage } = require("../vehicles/vehicles.model");
const { Op } = require("sequelize");
const { uuid } = require("../../helpers");
const { brand: Brand } = require("../brand/brand.model");
const { city: City } = require("../location/location.model");

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
  const { brandId, model, locationId, images, type, seat, rentPrice } = body

  Validator.registerAsync("check_brand", async function (id, attribute, req, passes) {
    const brandDetail = await Brand.findOne({
      where: {
        id,
        status: 1
      }
    })
    if(brandDetail) {
      passes ()
    } else {
      passes (false, 'invalid brand')
    }
  })

  Validator.registerAsync("check_location", async function (id, attribute, req, passes) {
    const locationDetail = await City.findOne({
      where: {
        id,
        status: 1
      }
    })
    if(locationDetail) {
      passes ()
    } else {
      passes (false, 'invalid location')
    }
  })

  const rules = {
    brandId: 'required|string|check_brand',
    model: 'required|min:1|max:255',
    locationId: 'required|check_location',
    images: 'required|array',
    'images.*': 'required|url',
    type: 'in:car,motorbike,minivan',
    seat: 'required|integer|min:1|max:100',
    rentPrice: 'required|integer'
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
      total: 0,
      result: []
    });
  }

  async function passes() {
    const t = await sequelize.transaction()
    try{
      const id = uuid()
      const params = {
        id,
        brandId,
        model,
        locationId,
        type: 1,
        seat,
        rentPrice
      }
      const paramsImage = []
      Object.values(images).forEach((image, index) => {
        const imageId = uuid(index)
        const obj = {
          id: imageId,
          vehicleId: id,
          url: image
        }
        paramsImage.push(obj)
      })
      await vehicle.create(params, {transaction: t})
      await vehicleImage.bulkCreate(paramsImage, {transaction: t})

      await t.commit()
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully store data",
        result: []
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