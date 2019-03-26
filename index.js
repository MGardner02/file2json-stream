'use strict'

const text2json = require('./text2json')

exports.Transform = text2json

// Order matters use event-stream map function

// Order doesnt matter use event-stream through function
