'require strict'
const Text2jsonTransform = require('../index').Transform
const stream = require('stream')
var assert = require('chai').assert;
var es = require('event-stream')

const mockReadStream = (array) => {
    var index = 0;
    return new stream.Readable({
        objectMode: true,
        read: function (size) {
            if (index < array.length) {
                return this.push(array[index++])
            } else {
                return this.push(null);
            }
        }
    });
};

describe('Array', function () {
    describe('Base Stream', function () {
        it('should parse basic read stream', function (done) {
            var contents = [
                'HEADER\n',
                'LINE001\n',
                'LINE002\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var text2json = new Text2jsonTransform(options, transformOpts)
            var parsedLines = []
            text2json.on('error', err => {
                console.log(err)
                assert.fail(err)
                done()
            }).on('line', line => {
                parsedLines.push(line)
            }).on('header', header => {
                assert.equal(header.header, 'HEADER')
            }).on('footer', footer => {
                assert.equal(footer.footer, 'FOOTER')
            }).on('invalid', invalid => {
                assert.fail(JSON.stringify(invalid))
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(parsedLines.length, 2)
                done();
            })

            input.pipe(text2json)
        })

        it('should parse basic read stream without header or footer', function (done) {
            var contents = [
                'LINE001\n',
                'LINE002\n',
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var text2json = new Text2jsonTransform(options, transformOpts)
            var parsedLines = []
            text2json.on('error', err => {
                console.log(err)
                assert.fail(err)
                done()
            }).on('line', line => {
                parsedLines.push(line)
            }).on('invalid', invalid => {
                assert.fail(JSON.stringify(invalid))
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(parsedLines.length, 2)
                done();
            })

            input.pipe(text2json)
        })

        it('should parse basic read stream without object mode', function (done) {
            var contents = [
                'HEADER\nLINE001\nLINE002\nFOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var text2json = new Text2jsonTransform(options)
            var parsedLines = []
            text2json.on('error', err => {
                console.log(err)
                assert.fail(err)
                done()
            }).on('header', header => {
                assert.equal(JSON.parse(header).header, 'HEADER')
            }).on('footer', footer => {
                assert.equal(JSON.parse(footer).footer, 'FOOTER')
            }).on('invalid', invalid => {
                assert.fail(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(parsedLines.length, 2)
                done();
            })

            input.pipe(text2json).pipe(es.through((line) => parsedLines.push(line)))
        })

        it('should throw an error for a missing footer', function (done) {
            var contents = [
                'HEADER\n',
                'LINE001\n',
                'LINE002\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: true
            }
            var transformOpts = {
                objectMode: true
            }
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.equal(err.message, 'Missing Footer')
            }).on('header', header => {
                assert.equal(header.header, 'HEADER')
            }).on('footer', footer => {
                assert.fail('footer found')
            }).on('invalid', invalid => {
                assert.fail(JSON.stringify(invalid))
            }).on('finish', () => done())

            var input = mockReadStream(contents)

            input.pipe(text2json)
        })

        it('should throw an error for a missing header', function (done) {
            var contents = [
                'LINE001\n',
                'LINE002\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: true
            }
            var transformOpts = {
                objectMode: true
            }
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.equal(err.message, 'Invalid Header')
                done()
            }).on('header', header => {
                assert.equal(header.header, 'HEADER')
            }).on('invalid', invalid => {
                assert.equal(invalid.invalidFields, 'header')
            }).on('finish', () => done())

            var input = mockReadStream(contents)

            input.pipe(text2json)
        })

        it('should not throw an error for a missing header', function (done) {
            var contents = [
                'LINE001\n',
                'LINE002\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: false,
                footerRequired: true
            }
            var transformOpts = {
                objectMode: true
            }
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.equal(err.message, 'Invalid Header')
                done()
            }).on('header', header => {
                assert.equal(header.header, 'HEADER')
            }).on('invalid', invalid => {
                assert.equal(invalid.invalidFields, 'header')
            }).on('finish', () => done())

            var input = mockReadStream(contents)

            input.pipe(text2json)
        })

        it('should find an invalid line', function (done) {
            var contents = [
                'HEADER\n',
                'LINE0A1\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record'
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var invalidLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.fail('line should be invalid')
            }).on('invalid', invalid => {
                invalidLines.push(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(invalidLines.length, 1)
                assert.equal(invalidLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should find an invalid line due to regex constraint', function (done) {
            var contents = [
                'HEADER\n',
                'LINE010\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record',
                    regex: /[0-9][2-9][0-9]/
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var invalidLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.fail('line should be invalid')
            }).on('invalid', invalid => {
                assert.equal(invalid.invalidFields.length, 1)
                assert.equal(invalid.invalidFields[0], 'record')
                invalidLines.push(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(invalidLines.length, 1)
                assert.equal(invalidLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should find two invalid lines due to improper length', function (done) {
            var contents = [
                'HEADER\n',
                'LINE0106\n',
                'LINE\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record',
                    regex: /[0-9][2-9][0-9]/
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var invalidLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.fail('line should be invalid')
            }).on('invalid', invalid => {
                invalidLines.push(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(invalidLines.length, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should find one valid line with regex constraint', function (done) {
            var contents = [
                'HEADER\n',
                'LINE010\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4,
                    value: 'text'
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record',
                    regex: /[0-9][0-9][0-9]/
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var validLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.equal(line.lineNumber, 2)
                validLines.push(line)
            }).on('invalid', invalid => {
                assert.fail(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(validLines.length, 1)
                assert.equal(validLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should find one valid line with an order defined', function (done) {
            var contents = [
                'HEADER\n',
                'LINE010\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record',
                    regex: /[0-9][0-9][0-9]/,
                    order: 2
                }, {
                    label: 'Text Column',
                    width: 4,
                    value: 'text',
                    order: 1
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var validLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.equal(line.lineNumber, 2)
                validLines.push(line)
            }).on('invalid', invalid => {
                assert.fail(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(validLines.length, 1)
                assert.equal(validLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should name the first row FIELD_1', function (done) {
            var contents = [
                'HEADER\n',
                'LINE010\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    value: 'record',
                    regex: /[0-9][0-9][0-9]/,
                    order: 2
                }, {
                    label: 'Text Column',
                    width: 4,
                    order: 1
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var validLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.ok(line.FIELD_1)
                validLines.push(line)
            }).on('invalid', invalid => {
                assert.fail(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(validLines.length, 1)
                assert.equal(validLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })

        it('should name the first row FIELD_1 without defined order or value', function (done) {
            var contents = [
                'HEADER\n',
                'LINE010\n',
                'FOOTER\n'
            ];

            var options = {
                fields: [{
                    label: 'Text Column',
                    width: 4
                }, {
                    label: 'Line Number',
                    width: 3,
                    scale: 0,
                    regex: /[0-9][0-9][0-9]/
                }],
                header: [{
                    label: 'Header',
                    width: 6,
                    value: 'header'
                }],
                footer: [{
                    label: 'Footer',
                    width: 6,
                    value: 'footer'
                }],
                headerRequired: true,
                footerRequired: false
            }
            var transformOpts = {
                objectMode: true
            }
            var validLines = [];
            var text2json = new Text2jsonTransform(options, transformOpts)
            text2json.on('error', err => {
                assert.fail(err)
                done()
            }).on('line', line => {
                assert.equal(line.FIELD_1, 'LINE')
                assert.equal(line.FIELD_2, 10)
                validLines.push(line)
            }).on('invalid', invalid => {
                assert.fail(invalid)
            })

            var input = mockReadStream(contents)
            input.on('end', () => {
                assert.equal(validLines.length, 1)
                assert.equal(validLines[0].lineNumber, 2)
                done()
            })

            input.pipe(text2json)
        })
    })
})
