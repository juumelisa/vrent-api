const Validator = require("validatorjs");
const { user: User, sequelize } = require("./user.model");
const { hashing, uuid } = require("../../helpers");
// const { city: City, province: Province } = require("../location/location.model");
// const { brand: Brand } = require("../brand/brand.model");
// const { getVehicle } = require("./user.helpers");
// const { Op } = require("sequelize");

// exports.info = async (req, res) => {
//   const { id } = req.params

//   const rules = {}

//   let errorMessage = {
//     in: "invalid :attribute"
//   };

//   let validation = new Validator(req.params, rules, errorMessage);
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
  const { name, email, password } = body
  
  Validator.registerAsync("check_email", async function (name, attribute, req, passes) {
    const user = await User.findOne({
      where: {
        email
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

// exports.login = async (req, res) => {
//   const body = req.body
//   const { email, password } = body
  
//   const rules = {
//     email: "required|email",
//     password: ["required"]
//   }

//   let errorMessage = {
//     in: "invalid :attribute"
//   };

//   let validation = new Validator(body, rules, errorMessage);
//   validation.checkAsync(passes, fails);

//   function fails() {
//     let message = []
//     console.log(validation.errors.all())
//     for (const key in validation.errors.all()) {
//       const value = validation.errors.all()[key];
//       message.push(value[0]);
//     }
//     res.status(200).json({
//       code: 400,
//       status: "error",
//       message: message,
//       result: []
//     });
//   }

//   async function passes() {
//     const t = await sequelize.transaction()
//     try {
//       const hashPassword = await hashing(password)

//       const user = await User.findOne({
//         where: {
//           email,
//           password: hashPassword
//         }
//       })
//       // if (user) {
//       //   const 
//       // }
//       const trimName = name.trim()
//       const params = {
//         id: id,
//         name: trimName,
//         email: email,
//         password: hashPassword
//       }
//       await User.create(params, {transaction: t})

//       // should send email
//       await t.commit ()
//       res.status(200).json({
//         status: "success",
//         code: 200,
//         message: "register success",
//         result: []
//       })
//     } catch (err) {
//       await t.rollback ()
//       const message = err.sql ? "internal server error" : err.message
//       res.status(200).json({
//         status: "error",
//         code: 400,
//         message: message,
//         result: []
//       })
//     }
//   }
// }