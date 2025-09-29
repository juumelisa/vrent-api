const Validator = require("validatorjs");
const Db = require("../transaction/transaction.model")

exports.lists = async (req, res) => {
  const query = req.query
  let { q, limit = 10, offset = 0, order = 'name', sort = 'asc', type, city } = query

  const rules = {
    q: 'string',
    limit: 'integer|min:1|max:100',
    offset: 'integer|min:0',
    order: 'in:name,createdAt,updatedAt',
    sort: 'in:asc,desc',
    type: 'in:car,motorbike,minivan'
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
        orderList = [['brand', 'name', sort], ['name', sort]]
      }
      if (type) {
        const keyType = getKeyByValue(vehicleType(), type)
        where.type = keyType
      }
      const where_city = {}
      if (city) {
        where_city.name = city
      }

      const transaction = await Db.transaction.findAndCountAll()
      const total = transaction.count
      const transactionList = transaction.rows
      // const result = getVehicle(vehicleList)
      res.status(200).json({
        status: "success",
        code: 200,
        limit,
        offset,
        message: "successfully fetch data",
        total,
        result: transactionList
      })
    } catch (err) {
      console.log(err)
      res.status(200).json({
        status: "error",
        code: 400,
        message: err.message,
        result: []
      })
    }
  }
}
