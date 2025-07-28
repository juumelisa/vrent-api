const Validator = require("validatorjs");
const { vehicle: Vehicle, vehicleImage: VehicleImage } = require("./vehicles.model");
// const { city: City, province: Province } = require("../location/location.model");
const { brand: Brand } = require("../brand/brand.model");
// const { getVehicle } = require("./vehicles.helpers");
// const { Op } = require("sequelize");
// const { getKeyByValue, vehicleType } = require("../../helpers");

// Vehicle.hasMany(VehicleImage, {as: 'images', foreignKey: 'vehicleId'})
// Vehicle.belongsTo(City, {as: 'city', foreignKey: 'locationId'})
// Vehicle.belongsTo(Brand, {as: 'brand', foreignKey: 'brandId'})

// exports.list = async (req, res) => {
//   const query = req.query
//   let { q, limit = 10, offset = 0, order = 'name', sort = 'asc', type } = query

//   const rules = {
//     q: 'string',
//     limit: 'integer|min:1|max:100',
//     offset: 'integer|min:0',
//     order: 'in:name,createdAt,updatedAt',
//     sort: 'in:asc,desc',
//     type: 'in:car,motorbike,minivan'
//   }

//   let error_msg = {
//     in: "invalid :attribute"
//   };

//   let validation = new Validator(query, rules, error_msg);
//   validation.checkAsync(passes, fails);

//   function fails() {
//     let message = []
//     for (var key in validation.errors.all()) {
//       var value = validation.errors.all()[key];
//       message.push(value[0]);
//     }
//     res.status(200).json({
//       code: 400,
//       status: "error",
//       message: message[0],
//       offset: offset,
//       limit: limit,
//       total: 0,
//       result: []
//     });
//   }

//   async function passes() {
//     try {
//       limit = parseInt(limit)
//       offset = parseInt(offset)
//       const where = {}
//       if (q) {
//         where[Op.or] = {
//           model: q
//         }
//       }
//       let orderList = [[order, sort]]
//       if (order === 'name') {
//         orderList = [['brand', 'name', sort], ['model', sort]]
//       }
//       if (type) {
//         const keyType = getKeyByValue(vehicleType(), type)
//         where.type = keyType
//       }
//       const vehicles = await Vehicle.findAndCountAll({
//         where,
//         distinct: true,
//         limit,
//         offset,
//         order: orderList,
//         include: [
//           {
//             model: Brand,
//             as: 'brand'
//           },
//           {
//             model: City,
//             as: 'city',
//             include: [
//               {
//                 model: Province,
//                 as: 'province'
//               }
//             ]
//           },
//           {
//             model: VehicleImage,
//             as: 'images'
//           }
//         ]
//       })
//       const total = vehicles.count
//       const vehicleList = vehicles.rows
//       const result = getVehicle(vehicleList)
//       res.status(200).json({
//         status: "success",
//         code: 200,
//         limit,
//         offset,
//         message: "successfully fetch data",
//         total,
//         result
//       })
//     } catch (err) {
//       res.status(200).json({
//         status: "error",
//         code: 400,
//         message: err.message,
//         result: []
//       })
//     }
//   }
// }

// exports.info = async (req, res) => {
//   const { id } = req.params

//   const rules = {}

//   let error_msg = {
//     in: "invalid :attribute"
//   };

//   let validation = new Validator(req.params, rules, error_msg);
//   validation.checkAsync(passes, fails);

//   function fails() {
//     let message = []
//     for (var key in validation.errors.all()) {
//       var value = validation.errors.all()[key];
//       message.push(value[0]);
//     }
//     res.status(200).json({
//       code: 400,
//       status: "error",
//       message: message[0],
//       result: []
//     });
//   }

//   async function passes() {
//     try {
//       const where = {
//         id,
//         status: {
//           [Op.ne]: 0
//         }
//       }
//       const vehicle = await Vehicle.findOne({
//         where,
//         include: [
//           {
//             model: Brand,
//             as: 'brand'
//           },
//           {
//             model: City,
//             as: 'city',
//             include: [
//               {
//                 model: Province,
//                 as: 'province'
//               }
//             ]
//           },
//           {
//             model: VehicleImage,
//             as: 'images'
//           }
//         ]
//       })
//       if (vehicle) {
//         const result = getVehicle([vehicle])
//         res.status(200).json({
//           status: "success",
//           code: 200,
//           message: "successfully fetch data",
//           result
//         })
//       } else {
//         res.status(200).json({
//           status: "success",
//           code: 404,
//           message: "data not found",
//           result: []
//         })
//       }
//     } catch (err) {
//       res.status(200).json({
//         status: "error",
//         code: 400,
//         message: err.message,
//         result: []
//       })
//     }
//   }
// }

exports.store = async (req, res) => {
  const body = req.body
  const { brandId, name, seat, price, type, locationId } = body
  
  Validator.registerAsync("check_brand", async function (id, attribute, req, passes) {
    const brand = await Brand.findOne({
      where: {
        id,
        status
      }
    })
    if (brand) {
      passes ()
    } else {
      passes (false, "invalid brand")
    }
  })

  const rules = {
    name: "required|max:255",
    brand: "required|check_brand",
    seat: "required|integer|min:1",
    price: "required|numeric",
    // type: "required"
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