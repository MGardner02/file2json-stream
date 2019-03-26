# file2json-stream

[![npm (scoped)](https://img.shields.io/npm/v/file2json-stream.svg)](https://github.com/MGardner02/file2json-stream)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/file2json-stream.svg)](https://github.com/MGardner02/file2json-stream)

The purpose of this module is to provide a simple in-stream interface to process text files line by line, with a known set of fields. The initial release will allow parsing of fields with fixed widths, with future plans to add the ability to break up lines using regex patterns.

The package uses the file specification provided by the user to generate a transform stream which will parse and validate the fields. Fully validated fields will be sent along the stream, invalid lines will be emitted for the user, the line number will be attached to either of these objects for reference.

This stream will work in object mode; in those cases an additional `line` event will be emitted as lines are parsed from each chunk.

### File Specifications

- `fields`: Is an array of field components necessary for the stream to correctly parse the file.

- `header` (optional): Is an array of field components which make up the formatted header.  If provided it will be assumed the first line of the file must be a header and will throw an `invalid` event if it could not be parsed successfully.

- `footer` (optional): Is an array of field components which make up the formatted footer.  If provided, the last line of each chunk will be checked to see if the format matches the footer.  There is never an assumption of the footer being the last line in the stream so no `invalid` events will be thrown like it does for the header.  However, if the last line is an invalid footer the `invalid` event would likely fire as an invalid `line` and this could be used to identify the contents of this line.

- `requiredHeader` (optional): If true and a `header` specification is provided, an invalid/missing header will result in an `error` event.

- `requiredFooter` (optional): If true and a `footer` specification, an invalid/missing footer will result in an `error` event.

#### Example Options configuration

```javascript

options = {

    fields: [
        {
            value: <string> | <function>,
            width: <integer>,
            regex: <RegExp>,
            order: <integer>,
            scale: <integer>
        }
    ],
    header: [
        {
            value: <string> | <function>,
            width: <integer>,
            regex: <RegExp>,
            scale: <integer>,
            order: <integer>
        }
    ],
    footer: [
        {
            value: <string> | <function>,
            width: <integer>,
            regex: <RegExp>,
            scale: <integer>,
            order: <integer>
        }
    ],
    headerRequired: <boolean>, // throw error if no header is found
    footerRequired: <boolean> // throw error if no footer is found once the stream has closed

}
```

#### Field Component Definition

Each field component is made up of the following attributes:

- `value`: Default field will be named FIELD\_[order || index] if value is undefined or not a string.

- `width`: Width of this column.

- `regex` (optional): Field will only be considered valid if a regex is defined and it matches against the parsed field.

- `order` (optional): Defines the order of the fields as they appear in the text file; should be consistently defined for all fields or none of them, otherwise unpredictable results may occur.

- `scale` (optional): Field will be scaled by a factor of 10, unless scale < 1 or left undefined; especially useful for flat files with no floating point specification to define the number of 0s in a field which are decimal places.

### Stream Events

The file2json-stream package is based off a transform stream and will have the standard events related to those include `finish` and `end` as well as a few custom events documented here.

- `header` is emitted if the first line of the file includes a valid header line per the header specification.

- `footer` is emitted if a valid footer line is identified per the footer specification.

- `invalid` is emitted if a line is found to be an invalid format match.  A _type_ attribute is included to indicate if the invalid line was the *header* or *line*.  Since it isn't known when the stream will end the footer will either be found or it won't.

- `error` is emitted for the usual errors found in stream.  Additional errors will be sent if the header was invalid and/or not found when the _headerRequired_ is set to true.  If a footer is not found and _footerRequired_ is set to true an error will be emitted when flushing the stream.

- `line` is emitted for each line as its parsed in the stream if the transform stream is configured with _objectMode_ set to true.

