# node-parse-buffer

Parse Buffer
----------------------

convert to object from buffer.

parse-buffer [![npm version](https://badge.fury.io/js/parse-buffer.svg)](http://badge.fury.io/js/parse-buffer)

Installation
-------

```
npm install parse-buffer
```

Example
-------

```js
var parser = require('parse-buffer');

var def = parser(p=>p.object(
  {version: p.string(':')},
  {message1: p.option(
    $=>$.version === '1',
    p.object(
      {key: p.string(',')},
      {val: p.string()},
      {etc: p.value('')}
    )
  )},
  {message2: p.option(
    $=>$.version === '2',
    p.object(
      {key: p.string(',')},
      {val: p.string(',')},
      {etc: p.array(';',
        p.string()
      )}
    )
  )}
))

var buf = new Buffer('1:234,abc');
var result = def.parse(buf);
// result.version === '1'
// result.message1.key === '234'
// result.message1.val === 'abc'
// result.message1.etc === ''

var buf = new Buffer('2:234,abc,x1;y2;z3');
var result = def.parse(buf);
// result.version === '2'
// result.message2.key === '234'
// result.message2.val === 'abc'
// result.message2.etc[0] === 'x1'
// result.message2.etc[1] === 'y1'
// result.message2.etc[2] === 'z1'
```

License
-------

MIT.
