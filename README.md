# untyped

A parser/validator for untyped object schemata.

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

and filters JavaScript objects against the parsed models:

```javascript
untyped.filter({
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
untyped.filter(anyobject(), parsedmodel()); // filters an object based on the parsed string
```

## examples

### [express](http://expressjs.com) + untyped:

```
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
        res.send(untyped.filter(
            longresult,
            untyped.parse(req.query.fields)
        ));
    } else {
        res.send(longresult);
    }
    
    next();
});
```