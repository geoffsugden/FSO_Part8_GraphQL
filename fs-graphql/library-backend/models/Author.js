const mongoose = require('mongoose')
const { AUTHOR_NAME_MIN_LENGTH } = require('../constants')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: AUTHOR_NAME_MIN_LENGTH,
  },
  born: {
    type: Number,
  },
})

module.exports = mongoose.model('Author', schema)
