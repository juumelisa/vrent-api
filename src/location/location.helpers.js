const getCity = (cities = []) => {
  const result = []
  Object.values(cities).forEach(city => {
    const obj = {
      id: city.id,
      name: city.name,
      province: city.province ? city.province.name : "-",
      image: city.image ? city.image : null,
      createdAt: city.createdAt ? city.createdAt : null,
      updatedAt: city.updatedAt ? city.updatedAt : null
    }
    result.push(obj)
  })
  return result
}

module.exports = {
  getCity
}