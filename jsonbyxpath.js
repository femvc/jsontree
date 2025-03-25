// 通过 XPath 访问 JSON 对象的属性
function parseJSONValueType(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value
}

function transValueType(value, type) {
  if (parseJSONValueType(value) === type) return value
  let result = value
  if (type === 'null') result = null
  if (type === 'undefined') result = undefined
  if (type === 'array') result = []
  if (type === 'object') result = {}
  if (type === 'string') {
    result = [null, undefined].includes(value) ? '' : String(value)
  }
  if (type === 'number') {
    result = Number(value)
    if (Number.isNaN(result)) {
      result = 0
    }
  }
  if (type === 'boolean') {
    result = value === 'false' ? false : Boolean(value)
  }
  return result
}

function findValueByXPath(obj, path) {
  if (!path || !path.replace(/\s+/g, '')) throw new Error('path is required.')
  if (!obj) throw new Error('obj is required.')
  path = path.replace(/^-/, '')

  // Object.entries(obj).forEach(([key, value]) => {
  //   console.log(key, value)
  // })
  path = path.replace(/\s+/g, '')
  let dep = path.split(':')[0].split('-')
  let key = path.split(':')[1]

  let cur = obj
  for (let i = 0, len = dep.length - 1; i < len; i++) {
    cur = Object.entries(cur)[dep[i]][1]
    if (!cur) {
      let err = `xpath '${path.split(':')[0]}' is not exist.`
      console.error(err)
      return err
    }
  }
  cur = Object.entries(cur)[dep[dep.length - 1]]
  if (!cur) {
    let err = `xpath '${path.split(':')[0]}' is not exist.`
    console.error(err)
    return err
  }
  let result = cur[1]
  if (key === 'key') result = cur[0]
  if (key === 'value') result = cur[1]
  if (key === 'type') result = parseJSONValueType(cur[1])
  return result
}
var getValueByXPath = findValueByXPath

function setValueByXPath(obj, path, val) {
  if (!path || !path.replace(/\s+/g, '')) throw new Error('path is required.')
  if (!obj) throw new Error('obj is required.')
  path = path.replace(/^-/, '')

  // Object.entries(obj).forEach(([key, value]) => {
  //   console.log(key, value)
  // })
  path = path.replace(/\s+/g, '')
  let dep = path.split(':')[0].split('-')
  let key = path.split(':')[1]

  let cur = obj
  let target = obj
  for (let i = 0, len = dep.length - 1; i < len; i++) {
    let item = Object.entries(cur)[dep[i]]
    if (!item) {
      let err = `xpath '${path.split(':')[0]}' is not exist.`
      console.error(err)
      return err
    }
    cur = item[1]
    target = target[item[0]]
  }
  let kv = Object.entries(cur)[dep[dep.length - 1]]
  if (!kv) {
    let err = `xpath '${path.split(':')[0]}' is not exist.`
    console.error(err)
    return err
  }
  let result = undefined

  if (key === 'key') {
    target[val] = kv[1]
    delete target[kv[0]]
    result = getValueByXPath(obj, path.split(':')[0] + ':key')
  }
  if (key === 'value') {
    target[kv[0]] = transValueType(val, parseJSONValueType(kv[1]))
    result = getValueByXPath(obj, path.split(':')[0] + ':value')
  }
  if (key === 'type') {
    target[kv[0]] = transValueType(kv[1], val)
    result = getValueByXPath(obj, path.split(':')[0] + ':value')
  }
  return result
}

if (typeof exports !== 'undefined') {
  exports.parseJSONValueType = parseJSONValueType
  exports.getValueByXPath = getValueByXPath
  exports.findValueByXPath = findValueByXPath
  exports.setValueByXPath = setValueByXPath
}
