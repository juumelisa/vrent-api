const getFAQ = () => {
  const list = [
    {
      id: 1,
      question: "How long i can rent a vehicle?",
      answer: "You can rent vehicle from 1 (one) to 30 (thirty) days."
    },
    {
      id: 2,
      question: "What type of vehicle do you rent?",
      answer: "We rent cars and motorcycle. Whether you need a family car, city vehicle, or operational fleet, our wide selection of vehicles is ready to support your personal, business, or travel needs."
    },
    {
      id: 3,
      question: "About us",
      answer: "We are a vehicle rental company based in Indonesia, committed to providing safe, convenient, and reliable transportation solutions. Whether you need a family car, city vehicle, or operational fleet, our wide selection of vehicles is ready to support your personal, business, or travel needs."
    },
    {
      id: 4,
      question: "Which area i can rent your vehicle?",
      answer: "We provided our service across many city in Indonesia such as Jakarta, Bali, Surabaya, Yogyakarta and many other cities."
    }
  ]
  return list
}

module.exports = {
  getFAQ
}