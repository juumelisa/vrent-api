exports.store = async (req, res) => {
  const file = req.file
  if (file && file.path) {
    res.status(200).json({
      status: "success",
      code: 200,
      message: "successfully upload file",
      result: [{
        url: file.path,
        size: file.size
      }]
    })
  } else {
    res.status(200).json({
      status: "error",
      code: 400,
      message: "invalid file",
      result: []
    })
  }
}