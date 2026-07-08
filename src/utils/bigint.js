const toBigInt = (value) => {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

module.exports = { toBigInt };
