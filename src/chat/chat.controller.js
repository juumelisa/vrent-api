const Validator = require("validatorjs");
const { searchVehicles, getVehicleList } = require("./chat.helpers");
const { default: redis } = require("../../config/redis.config");
const { getFAQ } = require("./chat.model");


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
      let vehicleList = []
      const vehicleKey = "vehiclelist";
      let vehicles = await redis.get(vehicleKey)
      let faq = getFAQ()
      if (vehicles) {
        vehicleList = JSON.parse(vehicles)
      } else {
        vehicleList = await getVehicleList()
        await redis.set(vehicleKey, JSON.stringify(vehicleList))
      }
      const dataset = [...vehicleList, ...faq]

      const lastMessages = messages.slice(-10)
      const contextMessage = lastMessages.map(msg => msg.content).join('. ')

      const results = await searchVehicles(dataset, contextMessage);
      context = results.map(vehicle => {
        let text
        if (vehicle.question && vehicle.answer) {
          text = `FAQ: ${vehicle.question} ${vehicle.answer}`
        } else {
          // const available = vehicle.availableDate.map(el => el).join(' or ')
          text = `${vehicle.name}. ${vehicle.type}. ${vehicle.location}.${vehicle.type == 'car' ? vehicle.seat + ' seat.' : ''} price per day: IDR ${vehicle.price || '200000'}.`
        }
        return text;
      }).join("\n");
      const chats = [
        {
          role: "system",
          content: "you are a helpful assistant for vehicle rental website. " +
          `You must ONLY help user for vehicle rent related things. You can use this data: ${context}. ` + 
          "Rules: " +
          "- Reply with at most 1-3 short sentences. " +
          "- Reply in the same language used by user. " +
          "- DON'T show the price unless user ask. " +
          "- DON'T make any assumption about what user want. " +
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
          stream: true,
        }),
      });
      // const data = await ollamaRes.json()
      res.setHeader("Content-Type", "text/event-stream"); // SSE-like
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }

      res.end();
      // res.status(200).json({
      //   status: "success",
      //   code: 200,
      //   message: "successfully send message",
      //   result: []
      // })
    } catch (err) {
      // console.log(err)
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