const getVehicle = (vehicleList = []) => {
  const result = []
  Object.values(vehicleList).forEach(vehicle => {
    const obj = {}
    obj.id = vehicle.id
    obj.brand = vehicle.brand ? vehicle.brand.name : null
    obj.model = vehicle.model
    obj.seat = vehicle.seat
    obj.rentPrice = vehicle.rentPrice
    obj.city = vehicle.city ? vehicle.city.name : null
    obj.province = vehicle.city && vehicle.city.province ? vehicle.city.province.name : null
    obj.images = vehicle.images && vehicle.images.length ? vehicle.images.map(el => el.url) : []

    result.push(obj)
  })
  return result
}

module.exports = {
  getVehicle
}