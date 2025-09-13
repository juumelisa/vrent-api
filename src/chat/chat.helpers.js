async function embedText(text) {
  try {
    const res = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
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

async function indexVehicles (vehicles) {
  for (let vehicle of vehicles) {
    const text = `${vehicle.title}: ${vehicle.type} ${vehicle.location}`;
    vehicle.embedding = await embedText(text);
  }
}

async function searchVehicles(vehicles, query, k = 2) {

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


module.exports = {
  embedText,
  cosineSimilarity,
  indexVehicles,
  searchVehicles
  // vectorStore: new VectorStore()
}