
const Db = require("../vehicles/vehicles.model");
const Db_brand = require("../brand/brand.model");
const Db_location = require("../location/location.model");
const Vehicle = Db.vehicle
const Brand = Db_brand.brand
const City = Db_location.city
const State = Db_location.state

async function embedText(text) {
  try {
    const res = await fetch(process.env.API_EMBED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.EMBED_MODEL, prompt: text }),
    });
    const data = await res.json();
    return data.embedding; // vector
  } catch (err) {
    console.log(err)
  }
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((acc, v, i) => acc + v * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, v) => acc + v * v, 0));
  const normB = Math.sqrt(vecB.reduce((acc, v) => acc + v * v, 0));
  return dot / (normA * normB);
}

async function indexVehicles (dataset) {
  for (let data of dataset) {
    if (!data.embedding) {
      let text
      if (data.question && data.answer) {
        text = `${data.question} Answer: ${data.asnwer}`;
      } else {
        text = `${data.title}: ${data.type}. ${data.seat} seat. ${data.location} ${data.price}`;
      }
      data.embedding = await embedText(text);
      if (data.type) {
        Vehicle.update({
          embedding: `[${data.embedding.join(",")}]`
        }, {
          where: {
            id: data.id
          }
        })
      }
    }
  }
}

async function searchVehicles(vehicles, query, k = 10) {
  await indexVehicles(vehicles);
  const queryEmb = await embedText(query);
  const scored = vehicles.map(p => ({
    ...p,
    score: cosineSimilarity(queryEmb, p.embedding),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

// class VectorStore {
//   constructor() {
//     this.docs = []; // { text, embedding }
//   }

//   add(text, embedding) {
//     this.docs.push({ text, embedding });
//   }

//   search(queryEmbedding, k = 3) {
//     // rank by cosine similarity
//     const scored = this.docs.map((doc) => ({
//       ...doc,
//       score: cosineSimilarity(queryEmbedding, doc.embedding),
//     }));
//     return scored
//       .sort((a, b) => b.score - a.score) // higher score first
//       .slice(0, k);
//   }
// }

// export const vectorStore = new VectorStore();

const getVehicleList = async () => {
  const rest = await Vehicle.findAll({
    where: {
      status: 1
    },
    limit: 100,
    order: [['created_at', 'desc']],
    include: [
      {
        model: Brand,
        as: 'brand'
      },
      {
        model: City,
        as: 'city',
        include: [
          {
            model: State,
            as: 'state'
          }
        ]
      }
    ]
  })
  const result = []
  Object.values(rest).forEach((vehicle, index) => {
    const obj = {
      id: vehicle.id,
      name: `${vehicle.brand.name} ${vehicle.name}`,
      type: vehicle.type == 1 ? "car" : "motorcycle",
      location: `${vehicle.city.name}, ${vehicle.city.state.name}`,
      price: vehicle.price,
      seat: vehicle.seat,
      embedding: JSON.parse(vehicle.embedding)
    }
    result[index] = obj
  })
  return result;
}

module.exports = {
  embedText,
  cosineSimilarity,
  indexVehicles,
  searchVehicles,
  getVehicleList
  // vectorStore: new VectorStore()
}