'require strict'
const Text2jsonTransform = require('../index').Transform
const stream = require('stream')
var assert = require('chai').assert;

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
    })
})
