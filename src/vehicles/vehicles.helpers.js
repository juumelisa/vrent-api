const getVehicle = (vehicleList = []) => {
  const result = []
  Object.values(vehicleList).forEach(vehicle => {
    const obj = {}
    obj.id = vehicle.id
    obj.brand = vehicle.brand ? vehicle.brand.name : null
    obj.name = vehicle.name
    obj.seat = vehicle.seat
    obj.price = vehicle.price
    obj.city = vehicle.city ? vehicle.city.name : null
    obj.state = vehicle.city && vehicle.city.state ? vehicle.city.state.name : null
    obj.images = vehicle.images && vehicle.images.length ? vehicle.images.map(el => el.url) : []

    result.push(obj)
  })
  return result
}

module.exports = {
  getVehicle
}