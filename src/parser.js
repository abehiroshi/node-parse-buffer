export default function parser(fn){
  var o = Object.create(parser.prototype)
  o.define(fn)
  return o
}

function indexOf(buf, search, offset=0){
  for (let i=offset; i < buf.length; i++){
    for (let j=0; j < search.length && i+j < buf.length; j++){
      if (buf[i+j] !== search[j]) break
      if (j === search.length - 1) return i
    }
  }
  return -1
}

function encode(buf, start, endOfChar, encoder){
  let index = indexOf(buf, new Buffer(endOfChar), start)
  if (index < 0) index = buf.length
  return {
    position: index + 1,
    encoded: encoder(buf.slice(start, index))
  }
}

parser.prototype = {
  define(fn){
    if (!(fn instanceof Function)) throw new Error(`argument "fn" is not Function : ${fn}`)
    this.parser = fn(this)
  },

  parse(buf){
    if (!Buffer.isBuffer(buf)) throw new Error(`argument "buf" is not Buffer : ${buf}`)
    return this.parser(buf).encoded
  },

  string(delim='', encoder=($=>$.toString())){
    if (typeof(delim) !== 'string') throw new Error(`argument "delim" is not String : ${delim}`)
    if (!(encoder instanceof Function)) throw new Error(`argument "encoder" is not Function : ${encoder}`)

    return (buf, root, offset=0)=>{
      return encode(
        buf,
        offset,
        delim,
        buf => encoder(buf, root)
      )
    }
  },

  object(...attributes){
    attributes.forEach((x,i)=>{
      if (!(x instanceof Object)) throw new Error(`argument "attributes[${i}]" is not Object : ${attributes}`)
      Object.keys(x).forEach(k=>{
        if (!(x[k] instanceof Function)) throw new Error(`argument "attributes[${i}][${k}]" is not Function : ${attributes}`)
      })
    })

    return (buf, root, offset=0)=>{
      let result = {}
      if (!root) root = result

      let currentPosition = offset
      attributes.forEach(attribute=>{
        Object.keys(attribute).forEach(key=>{
          let {position, encoded} = attribute[key](buf, root, currentPosition)
          currentPosition = position
          result[key] = encoded
        })
      })
      return {position: currentPosition, encoded: result}
    }
  },

  array(delim='', parser){
    if (typeof(delim) !== 'string') throw new Error(`argument "delim" is not String : ${delim}`)
    if (!(parser instanceof Function)) throw new Error(`argument "parser" is not Function : ${parser}`)

    return (buf, root, offset=0)=>{
      let result = []
      if (!root) root = result

      let currentPosition = offset
      while (currentPosition < buf.length){
        let {position, encoded} = encode(
          buf,
          currentPosition,
          delim,
          buf=>parser(buf, root).encoded
        )
        result.push(encoded)
        currentPosition = position
      }
      return {position: currentPosition, encoded: result}
    }
  },

  option(condition, parser){
    if (!(condition instanceof Function)) throw new Error(`argument "condition" is not Function : ${condition}`)
    if (!(parser instanceof Function)) throw new Error(`argument "parser" is not Function : ${parser}`)

    return (buf, root, offset=0)=>{
      if (condition(root)){
        return parser(buf, root, offset)
      } else {
        return {position: offset, encoded: undefined}
      }
    }
  },

  value(val){
    return (buf, root, offset=0)=>{
      return {position: offset, encoded: val}
    }
  }
}
