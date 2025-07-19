const Validator = require("validatorjs");
const { vehicle } = require("./vehicles.model");

exports.list = async (req, res) => {
  const query = req.query
  const { q, limit = 10, offset = 0 } = query

  // Validator.registerAsync("check_role", async function (role, attribute, req, passes) {
  // })

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
    const vehicles = await vehicle.findAll()
    res.status(200).json({
      status: "success",
      code: 200,
      message: "successfully fetch data",
      result: vehicles
    })
  }
}