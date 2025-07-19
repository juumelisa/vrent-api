const getCity = (cities = []) => {
  const result = []
  console.log(cities)
  Object.values(cities).forEach(city => {
    const obj = {
      id: city.id,
      name: city.name,
      province: city.province ? city.province.name : ''
    }
    result.push(obj)
  })
  return result
}

module.exports = {
  getCity
}