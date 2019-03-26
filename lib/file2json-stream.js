'use strict'
const Transform = require('stream').Transform

class file2jsonStream extends Transform {
    constructor(options, transformOptions) {
        super(transformOptions)
        this._lineCount = 1
        this._objectMode = transformOptions ? !!transformOptions.objectMode : false
        this._headerFound = false
        this._footerFound = false
        this.headerRequired = options.headerRequired
        this.footerRequired = options.footerRequired
        // format options into set of split up parallel arrays
        if (options.header) {
            this.header = this.generateOptionSet(options.header)
        }
        if (options.footer) {
            this.footer = this.generateOptionSet(options.footer)
        }
        this.fields = this.generateOptionSet(options.fields)
    }

    generateOptionSet(optionSet) {
        optionSet = optionSet.sort((a, b) => a.order - b.order)
        var set = {
            fields: [],
            widths: [],
            regex: [],
            scale: []
        }
        optionSet.forEach(option => {
            if (option.value && typeof option.value === 'string')
                set.fields.push(option.value)
            else
                set.fields.push('FIELD_' + (option.order !== undefined ? option.order : optionSet.length))
            set.widths.push(option.width)
            set.regex.push(option.regex)
            set.scale.push(option.scale === undefined || option.scale === null ? -1 : option.scale)
        })
        return set
    }

    formatData(data) {
        return this._objectMode ? data : JSON.stringify(data)
    }

    pushLine(data) {
        this.push(this.formatData(data))
        if (this._objectMode) {
            this.emit('line', this.formatData(data))
        }
    }

    pushHeader(data) {
        this._headerFound = true
        this.emit('header', this.formatData(data))
    }

    pushFooter(data) {
        this._footerFound = true
        this.emit('footer', this.formatData(data))
    }

    pushInvalidLine(data) {
        this.emit('invalid', this.formatData(data))
    }

    parseLine(line, optionSet) {
        line = line.trim()
        var total = optionSet.widths.reduce((sum, w) => sum + w)
        if (total === line.length) {
            var obj = {}
            var newLine = line
            for (var i = 0; i < optionSet.fields.length; i++) {
                var value = newLine.slice(0, optionSet.widths[i])
                newLine = newLine.slice(optionSet.widths[i])
                if (value.length === optionSet.widths[i]) {
                    if (optionSet.regex[i]) {
                        if (value.match(optionSet.regex[i])) {
                            if (optionSet.scale[i] !== undefined && optionSet.scale[i] >= 0 && !isNaN(value)) {
                                obj[optionSet.fields[i]] = Number(value) / Math.pow(10, optionSet.scale[i])
                            } else {
                                obj[optionSet.fields[i]] = value
                            }
                        }
                    } else {
                        if (optionSet.scale[i] !== undefined && optionSet.scale[i] >= 0 && !isNaN(value)) {
                            obj[optionSet.fields[i]] = Number(value) / Math.pow(10, optionSet.scale[i])
                        } else {
                            obj[optionSet.fields[i]] = value
                        }
                    }
                }
            }
            var invalidFields = optionSet.fields.filter(field => obj[field] === undefined)
            if (invalidFields.length > 0) {
                throw JSON.stringify({
                    invalidFields: invalidFields,
                    line: line
                })
            } else {
                return obj
            }
        } else {
            throw JSON.stringify({
                invalidFields: [...optionSet.fields],
                line: line
            })
        }
    }

    _flush(callback) {
        if (this.footer && !this._footerFound && this.options.footerRequired) {
            this.emit('error', new Error('Missing Footer'))
        }
        callback()
    }

    _transform(chunk, encoding, callback) {
        var lines = chunk.toString().split('\n')
        if (this.footer) {
            var lastLine = lines.pop()
            var footerObj
            try {
                footerObj = this.parseLine(lastLine, this.footer)
            } catch (err) {
                lines.push(lastLine)
            }
        }
        // check the last line in case its the final chunk and contains the footer
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i]
            var obj
            var errObj
            if (this._lineCount === 1 && this.header) {
                try {
                    obj = this.parseLine(line, this.header)
                    obj.lineNumber = this._lineCount
                    this.pushHeader(obj)
                } catch (err) {
                    errObj = JSON.parse(err)
                    errObj.lineNumber = this._lineCount
                    errObj.type = 'header'
                    this.pushInvalidLine(errObj)
                    if (this.options.headerRequired) {
                        this.emit('error', new Error('Invalid Header'))
                    }
                }
            } else {
                try {
                    obj = this.parseLine(line, this.fields)
                    obj.lineNumber = this._lineCount
                    this.pushLine(obj)
                } catch (err) {
                    errObj = JSON.parse(err)
                    errObj.lineNumber = this._lineCount
                    errObj.type = 'line'
                    this.pushInvalidLine(errObj)
                }
            }
            this._lineCount++
        }
        if (footerObj) {
            footerObj.lineNumber = this._lineCount
            this.pushFooter(footerObj)
        }
        callback()
    }
}

module.exports = file2jsonStream
