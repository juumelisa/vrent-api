const Validator = require("validatorjs");
const Db = require("./chat.model");
const { Op } = require("sequelize");
const { searchVehicles } = require("./chat.helpers");
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
  const { client_id, messages } = body

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
    // const t = await Db.sequelize.transaction()
    try{
      const vehicleList = [
        {
          id: 1,
          name: "Honda Brio",
          type: "car",
          location: "Bandung"
        },
        {
          id: 2,
          name: "Yamaha Mio",
          type: "motorcycle",
          location: "Jakarta"
        },
        {
          id: 3,
          name: "Honda Civic",
          type: "car",
          location: "Jakarta"
        },
        {
          id: 4,
          name: "Honda Brio",
          type: "car",
          location: "Bali"
        },
        {
          id: 5,
          name: "Honda Beat",
          type: "motorcycle",
          location: "Bali"
        },
        {
          id: 6,
          name: "Kijang Innova",
          type: "car",
          location: "Jakarta"
        }
      ]
      // const id = uuid()
      // const params = {
      //   id,
      //   name
      // }
      // await Brand.create(params, {transaction: t})
      // await t.commit()

      // {
      //   "model": "llama3",
      //   "prompt": "Hello, how are you?","stream": false
      // }

      const contextMessage = messages.map(msg => {
        if (msg.role == "user") {
          return msg.content
        } else {
          return ""
        }
      }).join('. ')
      const lastUserMsg = messages[messages.length - 1].content;

      const results = await searchVehicles(vehicleList, contextMessage);
      const context = results.map(vehicle => `${vehicle.name}: ${vehicle.location}`).join("\n");
      // const contextDocs = vectorStore.search(qEmbedding, 3); // top 3 matches
      // const contextText = contextDocs.map((d) => d.text).join("\n\n");
      const chats = [
        {
          role: "system",
          content: `you are a helpful assistant for vehicle rental website. you only help user for vehicle rent related things with this data: ${context}. if user ask unrelated question, please refuse`
        },
        ...messages
        // {
        //   role: "user",
        //   content: `Context:\n${context}\n\nQuestion: ${lastUserMsg}`
        // }
      ]

      // const lastMessageIndex = chats.length - 1
      // chats[lastMessageIndex].content = `Context:\n${context}\n\nQuestion: ${lastUserMsg}`
      // const data = {}
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