exports.validation = (rules = {}, data = {}) => {
  let errors = []
  Object.keys(rules).forEach((key) => {
    console.log(key)
    const rule = rules[key].split('|')
    if (rule.includes('required') && !data[key]) {
      errors.push(`${key} is required`)
    }
  })
  const result = {
    success: errors.length ? false : true,
    errors
  }
  return result
}