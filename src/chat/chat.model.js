const getVehicleList = () => {
  const list = [
    {
      id: 1,
      name: "Honda Brio",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - Oktober 17 2025"
      ]
    },
    {
      id: 2,
      name: "Jeep Wrengler",
      type: "car",
      location: "Yogyakarta",
      price: 500000,
      availableDate: [
        "September 25 2025 - September 26 2025",
        "October 11 2025 - October 12 2025"
      ]
    },
    {
      id: 3,
      name: "Jeep Wrengler",
      type: "car",
      location: "Bali",
      availableDate: [
        "October 11 2025 - October 15 2025"
      ]
    },
    {
      id: 4,
      name: "Yamaha Mio",
      type: "motorcyle",
      location: "Bali",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 5,
      name: "BMW X6",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 17 2025"
      ]
    },
    {
      id: 6,
      name: "Kijang Innova",
      type: "car",
      location: "Jakarta",
      price: 150000,
      availableDate: [
        "September 17 2025 - October 17 2025"
      ]
    },
    {
      id: 7,
      name: "Honda Brio",
      type: "car",
      location: "Bali",
      availableDate: [
        "September 17 2025 - October 17 2025"
      ]
    },
    {
      id: 8,
      name: "Honda Brio",
      type: "car",
      location: "Bandung",
      price: 125000,
      availableDate: [
        "September 17 2025 - October 17 2025"
      ]
    },
    {
      id: 9,
      name: "Kijang Innova",
      type: "car",
      price: "150000",
      location: "Bandung",
      price: 180000,
      availableDate: [
        "September 17 2025 - October 17 2025"
      ]
    },
    {
      id: 10,
      name: "Toyota Agya",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - September 20 2025",
        "September 28 2025 - September 30 2025",
        "October 9 2025 - October 15 2025"
      ]
    },
    {
      id: 11,
      name: "Toyota Agya",
      type: "car",
      location: "Yogyakarta",
      price: 125000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 12,
      name: "Toyota Agya",
      type: "car",
      location: "Bandung",
      price: 125000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 13,
      name: "Toyota Agya",
      type: "car",
      location: "Palembang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 14,
      name: "Honda Brio",
      type: "car",
      location: "Palembang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 15,
      name: "Honda Brio",
      type: "car",
      location: "Semarang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 16,
      name: "Suzuki Swift",
      type: "car",
      location: "Semarang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 17,
      name: "Suzuki Swift",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 18,
      name: "Suzuki Swift",
      type: "car",
      location: "Bandung",
      price: 155000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 19,
      name: "Suzuki Swift",
      type: "car",
      location: "Surabaya",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 20,
      name: "Suzuki Swift",
      type: "car",
      location: "Bali",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 21,
      name: "Suzuki Swift",
      type: "car",
      location: "Yogyakarta",
      price: 180000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 22,
      name: "Suzuki Swift",
      type: "car",
      location: "Palembang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 23,
      name: "Suzuki Swift",
      type: "car",
      location: "Medan",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 24,
      name: "Suzuki Swift",
      type: "car",
      location: "Malang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 25,
      name: "Toyota Vios",
      type: "car",
      location: "Malang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 26,
      name: "Toyota Vios",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 27,
      name: "Toyota Vios",
      type: "car",
      location: "Bandung",
      price: 180000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 28,
      name: "Toyota Vios",
      type: "car",
      location: "Semarang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 29,
      name: "Toyota Vios",
      type: "car",
      location: "Surabaya",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 30,
      name: "Toyota Vios",
      type: "car",
      location: "Yogyakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 31,
      name: "Mercedes-Benz C-Class",
      type: "car",
      location: "Bali",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 32,
      name: "Mercedes-Benz C-Class",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 33,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 34,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Yogyakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 35,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Bandung",
      price: 200000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 36,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Semarang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 37,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Surabaya",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 38,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Medan",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 39,
      name: "Mitsubishi Xpander",
      type: "car",
      location: "Palembang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 40,
      name: "Honda HR-V",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 41,
      name: "Toyota Fortuner",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 42,
      name: "Toyota Fortuner",
      type: "car",
      location: "Bandung",
      price: 250000,
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 43,
      name: "Isuzu Elf",
      type: "car",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 44,
      name: "Isuzu Elf",
      type: "car",
      location: "Yogyakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 45,
      name: "Isuzu Elf",
      type: "car",
      location: "Malang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 46,
      name: "Isuzu Elf",
      type: "car",
      location: "Semarang",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 46,
      name: "Isuzu Elf",
      type: "car",
      location: "Surabaya",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 47,
      name: "Honda Beat",
      type: "motorcycle",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
    {
      id: 47,
      name: "Honda Vario",
      type: "motorcycle",
      location: "Jakarta",
      availableDate: [
        "September 17 2025 - October 15 2025"
      ]
    },
  ]
  return list
}

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
  getVehicleList,
  getFAQ
}