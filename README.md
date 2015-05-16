# untyped

A parser/validator for untyped object schemata.

*This is an export of model.js from [dominikschreiber/express-persistent-resource](https://github.com/dominikschreiber/express-persistent-resource).*

## what is this?

Untyped object schemata are common in REST partial response queries and look like

```
http://api.foo/bar?fields=baz,bam
```

This is expected to give a result that only contains `baz` and `bam` properties, e.g.

```javascript
{
    baz: 'Foo',
    bam: 'Bar'
}
```

More a more complex schema would be for example

```
name:(givenname,familyname),address:(zip,street)
```

which is expected to result in

```javascript
{
    name: {
        givenname: 'Firstname',
        familyname: 'Lastname'
    },
    address: {
        zip: 12345,
        street: 'Example Street'
    }
}
```

## how does `untyped` help?

It parses untyped object schemata (e.g. fields strings)

```javascript
var untyped = require('untyped')

  , model = untyped.parse('name:(givenname,familyname),address:(zip,street)')
// => model == {name: {givenname: true, familyname: true}, address: {zip: true, street: true}}
```

and validates JavaScript objects against the parsed models:

```javascript
untyped.validate({
    name: {
        givenname: 'Foo',
        middlename: 'Wololo',
        familyname: 'Bar'
    },
    address: {
        zip: 12345,
        street: 'Example Street',
        housenumber: 9
    },
    info: {
        smokes: true
    }
}, model);
// => {name: {givenname: 'Foo', familyname: 'Bar'}, address: {zip: 12345, street: 'Example Street'}}
```

## get started

`untyped` is registered in the node package registry, so simply perform

```bash
npm install [--save] untyped
```

Then require it:

```javascript
var untyped = require('untyped');
```

And use it:

```javascript
untyped.parse(schemastring()); // parses an object schema
untyped.validate(anyobject(), parsedmodel()); // validates an object based on the parsed string
```

## features

See the [tests](https://github.com/dominikschreiber/untyped/blob/master/test/index.spec.js)
for more detailed feature descriptions.

### `untyped.parse(unparsedschema)`

parses an untyped schema to a JSON object.

```javascript
untyped.parse('foo,bar:(baz,bam)')
// =>
{
    foo: true,
    bar: {
        baz: true,
        bam: true
    }
}
```

### `untyped.stringify(jsonschema)`

creates a schema string from a JSON object.

```javascript
untyped.stringify({
    foo: true,
    bar: {
        baz: true,
        bam: true
    }
})
// =>
'foo,bar:(baz,bam)'
```

### `untyped.validate(object, jsonschema)`

picks only (nested) properties from `object` that match `jsonschema`.

```javascript
untyped.validate({
    foo: 'Yep',
    wohoo: 'Nope'
}, {
    foo: true,
    bar: {
        baz: true,
        bam: true
    }
})
// =>
{
    foo: 'Yep'
}
```

### `untyped.matches(object, filter)`

checks if `object` matches `filter`, where `filter` is defined as

```javascript
{
    property: // the property that should be checked, a schema string (e.g. 'foo:(bar)')
    match: // one of ['=', '~', '|', '*', '^', '$']
    filter: // the value that the property should match
}
```

with the following match types (similar to [css3 attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors#Summary)):

- `=` exact match
- `~` one of match
- `|` exact/starts with match
- `*` contains match
- `^` startswith match
- `$` endswith match

```javascript
untyped.matches({
    foo: 'Yep',
    bar: 'Nope'
}, {
    property: 'foo',
    match: '*',
    filter: 'p'
})
// =>
true
```

### `untyped.filter(objects, filters)`

filters a list of `objects` find all that match all `filters`

```javascript
untyped.filter([{
    foo: 'Yep',
    bar: 'Nope'
}, {
    foo: 'Nope',
    bar: 'Nope'
}], [
    property: 'foo',
    match: '=',
    filter: 'Yep'
])
// =>
[{
    foo: 'Yep',
    bar: 'Nope'
}]
```

## examples

### [express](http://expressjs.com) + untyped:

```javascript
var app = require('express')()
  , untyped = require('untyped');

app.use('/', function(req, res, next) {
    var longresult = {
            a: {very: 'long', object: 'that'},
            you: {probably: 'got', from: 'your'},
            database: {and: 'that', no: 'one'},
            wants: {to: 'get', in: 'total'}
        };

    if (req.query.fields) {
        res.send(untyped.validate(
            longresult,
            untyped.parse(req.query.fields)
        ));
    } else {
        res.send(longresult);
    }
    
    next();
});
```