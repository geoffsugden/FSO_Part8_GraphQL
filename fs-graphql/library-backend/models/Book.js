const mongoose = require('mongoose')
const { BOOK_TITLE_MIN_LENGTH } = require('../constants')

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    minlength: BOOK_TITLE_MIN_LENGTH,
  },
  published: {
    type: Number,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
  },
  genres: [{ type: String }],
})

module.exports = mongoose.model('Book', schema)
