var express = require('express');
var router = express.Router();
/* GET home page. */

var axios = require('axios')
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/chat', async function(req, res, next) {
  // res.render('index', { title: 'Express' });
  const { messages } = req.body;

  try {
    const data = [
      {
        name: "Honda Brio",
        seat: 5,
        location: "Yogyakarta",
        stock: 2
      },
      {
        name: "Daihatsu Xenia",
        seat: 7,
        location: "Yogyakarta",
        stock: 1
      },
      {
        name: "Daihatsu Xenia",
        seat: 7,
        location: "Jakarta",
        stock: 2
      },
      {
        name: "Suzuki XL7 ",
        seat: 7,
        location: "Yogyakarta",
        stock: 3
      }
    ]

    const dataText = data.map(el => `- ${el.name}: ${el.seat} seat, available in ${el.location}, available stock ${el.stock}`).join('\n')
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3', // or 'mistral', 'phi3', etc.
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for a vehicle rental business. Answer questions only about rentals or services. Answer only using the following product list: ${dataText}. If the user asks about an item not in the list, politely say it is not available.`
        },
        { role: 'user', content: "hei" },
        { role: 'user', content: "i want to rent a car in yogyakarta" },
        { role: 'user', content: "do you have any with 7 seat?" },
        {
          "role": "assistant",
          "content": "Yes, we do have vehicles with 7 seats available for rent in Yogyakarta!\n\nWe have two options: the Daihatsu Xenia (available stock: 1) and the Suzuki XL7 (available stock: 3).\n\nWhich one would you like to choose?"
        },
        { role: 'user', content: "which one is better?" },
        {
          "role": "assistant",
          "content": "Both the Daihatsu Xenia and Suzuki XL7 are great choices! However, it ultimately depends on your personal preferences and needs.\n\nThe Daihatsu Xenia is a reliable and spacious option with 7 seats. It's perfect for families or groups of people who need to transport multiple passengers comfortably.\n\nOn the other hand, the Suzuki XL7 is a more modern and feature-packed option. It offers advanced safety features, comfortable seating, and ample cargo space. If you're looking for a car with the latest tech and amenities, this might be the better choice for you!\n\nWhich one do you think suits your needs?"
        },
        { role: 'user', content: "well then i prefer Suzuki XL7" },
        {
          "role": "assistant",
          "content": "The Suzuki XL7 is a popular choice among our customers, and for good reason.\n\nYou're in luck because we have three units available in Yogyakarta, so you can choose the one that best fits your needs!\n\nWould you like to reserve one of our Suzuki XL7s or would you like me to help with any other questions or concerns?"
        },
        { role: 'user', content: "yes i want to reserve it" },
      ],
      stream: false
    });
    res.status(200).json(response.data.message);
  } catch (error) {
    console.error('Ollama error:', error.message);
    res.status(500).json({ error: 'Failed to connect to Ollama' });
  }
});

module.exports = router;
