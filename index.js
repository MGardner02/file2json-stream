'use strict'

const file2jsonStream = require('./lib/file2json-stream')

exports.Transform = file2jsonStream

// Order matters use event-stream map function

// Order doesnt matter use event-stream through function
