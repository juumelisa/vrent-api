const Validator = require("validatorjs");
const Db = require("./chat.model");
const { Op } = require("sequelize");
const { searchVehicles } = require("./chat.helpers");
const { default: redis } = require("../../config/redis.config");
const Brand = Db.brand

exports.list = async (req, res) => {
  const query = req.query
  let { q, limit = 10, offset = 0, order = 'name', sort = 'asc' } = query

  const rules = {
    q: 'string',
    limit: 'integer|min:1|max:100',
    offset: 'integer|min:0',
    order: 'in:name,created_at,updated_at',
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
      limit = parseInt(limit)
      offset = parseInt(offset)
      const where = {}
      if (q) {
        where.name = {
          [Op.substring]: q
        }
      }
      const brands = await Brand.findAndCountAll({
        attributes: ['id', 'name'],
        where,
        order: [[order, sort]],
        limit,
        offset
      })
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully fetch data",
        limit,
        offset,
        total: brands.count,
        result: brands.rows
      })
    } catch (err) {
      const message = err.sql ? 'query syntax error' : err.message
      res.status(200).json({
        status: "success",
        code: 400,
        message: message,
        result: []
      })
    }
  }
}

exports.store = (req, res) => {
  const body = req.body
  const { messages } = body

  const rules = {
    messages: 'required|array',
    'messages.*.role': 'required|in:user,assistant',
    'messages.*.content': 'required|string|min:1'
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
    try{
      let vehicleList
      const cacheKey = "vehicle:list";
      const cached = await redis.get(cacheKey);
      if (cached) {
        vehicleList = JSON.parse(cached)
      } else {
        vehicleList = Db.getVehicleList()
        await redis.set(cacheKey, JSON.stringify(vehicleList))
      }

      let faq
      const cacheFaqKey = "faq:list";
      const cachedFaq = await redis.get(cacheFaqKey);
      if (cachedFaq) {
        faq = JSON.parse(cachedFaq)
      } else {
        faq = Db.getFAQ()
        await redis.set(cacheFaqKey, JSON.stringify(faq))
      }

      const dataset = [...vehicleList, ...faq]

      const contextMessage = messages.map(msg => {
        if (msg.role == "user" || msg.role == "assistant") {
          return msg.content
        } else {
          return ""
        }
      }).join('. ')

      const results = await searchVehicles(dataset, contextMessage);

      const context = results.map(vehicle => {
        let text
        if (vehicle.question && vehicle.answer) {
          text = `FAQ: ${vehicle.question} ${vehicle.answer}`
        } else {
          const available = vehicle.availableDate.map(el => el).join(' or ')
          text = `${vehicle.name}. ${vehicle.location}. price per day: IDR ${vehicle.price || '200000'}. any date around ${available} is available. link: http://localhost:3000/rent/${vehicle.id} `
        }
        return text;
      }).join("\n");
      
      const chats = [
        {
          role: "system",
          content: "you are a helpful assistant for vehicle rental website. " +
          `You must ONLY help user for vehicle rent related things. You can use this data: ${context}. ` + 
          "Rules: " +
          "- Reply with at most 1-5 short sentences. " +
          "- You must ONLY give link in format [LINK: ]. " +
          "- If user ask unrelated question, please refuse."
        },
        ...messages
      ]

      const ollamaRes = await fetch(process.env.ASSISTANT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.MODEL,
          messages: chats,
          stream: false,
        }),
      });
      const data = await ollamaRes.json()
      // res.setHeader("Content-Type", "text/event-stream"); // SSE-like
      // res.setHeader("Cache-Control", "no-cache");
      // res.setHeader("Connection", "keep-alive");

      // const reader = ollamaRes.body.getReader();
      // const decoder = new TextDecoder();

      // while (true) {
      //   const { done, value } = await reader.read();
      //   if (done) break;

      //   const chunk = decoder.decode(value, { stream: true });
      //   res.write(chunk); // forward directly to client
      // }

      // res.end();
      res.status(200).json({
        status: "success",
        code: 200,
        message: "successfully send message",
        result: [data]
      })
    } catch (err) {
      // await t.commit()
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