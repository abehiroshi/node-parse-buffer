'use strict'

import assert from 'power-assert'
import parser from '../src/parser'

describe('parser', ()=>{
  it('sample', ()=>{
    let def = parser(p=>p.object(
      {version: p.string(':')},
      {message1: p.option(
        $=>$.version === '1',
        p.object(
          {key: p.string(',')},
          {val: p.string()}
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

    let buf = new Buffer('1:234,abc')
    let result = def.parse(buf)
    assert(result.version === '1')
    assert(result.message1.key === '234')
    assert(result.message1.val === 'abc')

    buf = new Buffer('2:234,abc,x1;y2;z3')
    result = def.parse(buf)
    assert(result.version === '2')
    assert(result.message2.key === '234')
    assert(result.message2.val === 'abc')
    assert(result.message2.etc[0] === 'x1')
    assert(result.message2.etc[1] === 'y2')
    assert(result.message2.etc[2] === 'z3')
  })

  it('parse string', ()=>{
    let result = parser(p=>p.string(':')).parse(new Buffer('1:234'))
    assert(result === '1')
  })

  it('parse string encoder', ()=>{
    let result = parser(p=>p.object(
      {version: p.string(':', (buf, $)=>{
        return 'x' + buf.toString()
      })},
      {id: p.string(':', (buf, $)=>{
        assert($.version === 'x1')
        return 'y' + buf.toString()
      })}
    )).parse(new Buffer('1:234'))

    assert(result.version === 'x1')
    assert(result.id === 'y234')
  })

  it('parse string all', ()=>{
    let result = parser(p=>p.string()).parse(new Buffer('1:234'))
    assert(result === '1:234')
  })

  it('parse object', ()=>{
    let result = parser(p=>p.object(
      {version: p.string(':')},
      {id:      p.string(':')}
    )).parse(new Buffer('1:234'))

    assert(result.version === '1')
    assert(result.id === '234')
  })

  it('parse object in object', ()=>{
    let result = parser(p=>p.object(
      {version: p.string(':')},
      {message: p.option(
        $=>$.version === '1',
        p.object(
          {key: p.string('\0')},
          {val: p.string('\0')}
        )
      )}
    )).parse(new Buffer('1:234\0abc'))

    assert(result.version === '1')
    assert(result.message.key === '234')
    assert(result.message.val === 'abc')
  })

  it('parse array', ()=>{
    let result = parser(p=>p.array(':',
      p.string()
    )).parse(new Buffer('1:234:abc'))

    assert(result[0] === '1')
    assert(result[1] === '234')
    assert(result[2] === 'abc')
  })

  it('parse array in array', ()=>{
    let result = parser(p=>p.array(':',
      p.array('=', p.string())
    )).parse(new Buffer('x=1:y=234:z=abc'))

    assert(result[0][0] === 'x')
    assert(result[0][1] === '1')
    assert(result[1][0] === 'y')
    assert(result[1][1] === '234')
    assert(result[2][0] === 'z')
    assert(result[2][1] === 'abc')
  })

  it('parse option', ()=>{
    let result = parser(p=>p.object(
      {version: p.option(
        $=>true,
        p.string(':')
      )},
      {id: p.option(
        $=>false,
        p.string(':')
      )},
      {user: p.option(
        $=>($.version === '1'),
        p.string(':')
      )}
    )).parse(new Buffer('1:234:abc'))

    assert(result.version === '1')
    assert(result.id === undefined)
    assert(result.user === '234')
  })

  it('error', ()=>{
    assert.throws(
      ()=>parser(),
      /is not Function/, '"fn" of parser(fn) is not Function'
    )

    assert.throws(
      ()=>parser(p=>p.string()).parse(),
      /is not Buffer/, '"buf" of parse(buf) is not Buffer'
    )

    assert.throws(
      ()=>parser(p=>p.string(1)),
      /is not String/, '"delim" of string(delim, encorder) is not String'
    )

    assert.throws(
      ()=>parser(p=>p.string('', 1)),
      /is not Function/, '"encorder" of string(delim, encorder) is not Function'
    )

    assert.throws(
      ()=>parser(p=>p.object(1)),
      /is not Object/, '"attributes[x]" of object(...attributes) is not Object'
    )

    assert.throws(
      ()=>parser(p=>p.object({a: 1})),
      /is not Function/, '"attributes[x][y]" of object(...attributes) is not Function'
    )

    assert.throws(
      ()=>parser(p=>p.array(1)),
      /is not String/, '"delim" of array(delim, parser) is not String'
    )

    assert.throws(
      ()=>parser(p=>p.array('', 1)),
      /is not Function/, '"parser" of array(delim, parser) is not Function'
    )

    assert.throws(
      ()=>parser(p=>p.option(1)),
      /"condition" is not Function/, '"condition" of option(condition, parser) is not Function'
    )

    assert.throws(
      ()=>parser(p=>p.option(()=>{}, 1)),
      /"parser" is not Function/, '"parser" of option(condition, parser) is not Function'
    )
  })
})
