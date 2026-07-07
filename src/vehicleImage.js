const placeholderImage = (brand, model) =>
  `https://placehold.co/600x400/png?text=${encodeURIComponent(`${brand} ${model}`)}`;

module.exports = { placeholderImage };
