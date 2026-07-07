const TRANSMISSION_CODES = {
  Manual: 1,
  Automatic: 2,
};

const TRANSMISSION_LABELS = Object.fromEntries(
  Object.entries(TRANSMISSION_CODES).map(([label, code]) => [code, label])
);

module.exports = { TRANSMISSION_CODES, TRANSMISSION_LABELS };
