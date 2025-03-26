/**
 * Adapted the code in to order to run in a web worker.
 *
 * Original author: Benjamin Hollis
 * Maintained by teocci on 11/28/17.
 */
function parseJSONValueType(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value
}
function htmlEncode(t) {
  if (t == null) return ''

  return t
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ /g, '&nbsp;')
}

function addComma(index, length) {
  return index < length - 1 ? ',' : ''
}

function decorateWithSpan(value, index, length, prefix) {
  // return `<span class="${className}">${htmlEncode(value)}</span>`
  let str = ''
  const type = parseJSONValueType(value)
  switch (type) {
    case 'null':
      str = `<input type="text" disabled value="null">`
      break
    case 'undefined':
      str = `<input type="text" disabled value="undefined">`
      break
    case 'boolean':
      str = `<select name="value" idx="${prefix}:value">
      <option value="true" ${value ? 'selected' : ''}>true</option>
      <option value="false" ${!value ? 'selected' : ''}>false</option></select>`
      break
    case 'number':
      str = `<input type="number" idx="${prefix}:value" value="${value}">`
      break
    case 'string':
      str = `<input type="text" idx="${prefix}:value" value="${htmlEncode(value)}">`
      break
    default:
      str = ''
  }
  return `<div class="type-select-item">
      <select name="type" idx="${prefix}:type" class="type-select">
        <option value="string" ${type === 'string' ? 'selected' : ''}>string</option>
        <option value="object">object</option>
        <option value="array">array</option>
        <option value="number" ${type === 'number' ? 'selected' : ''}>number</option>
        <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>boolean</option>
        <option value="undefined" ${type === 'undefined' ? 'selected' : ''}>undefined</option>
        <option value="null" ${type === 'null' ? 'selected' : ''}>null</option>
      </select>
    </div><div class="value-input-item">
      ${str}
    </div>${addComma(index, length)}<div class="operate-item">
      
    </div>`
}

function valueToHTML(value, index, length, prefix) {
  const type = value === null ? 'null' : typeof value
  let output = ''

  switch (type) {
    case 'object':
      output +=
        value && value.constructor === Array
          ? arrayToHTML(value, prefix)
          : objectToHTML(value, prefix)
      break

    case 'number':
    case 'string':
    case 'boolean':
    case 'undefined':
    case 'null':
      output += decorateWithSpan(value, index, length, prefix)
      break

    default:
      // output += decorateWithSpan(type, 'other')
      break
  }

  return output
}

function arrayToHTML(data, prefix) {
  const length = data.length
  let output = `<div class="collapser"><i><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></i></div>
      <select name="type" idx="${prefix}:type" style="${
      prefix ? '' : 'display:none'
    }" class="type-select">
        <option value="string">string</option>
        <option value="object">object</option>
        <option value="array" selected>array</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="undefined">undefined</option>
        <option value="null">null</option>
      </select>[<div class="operate-item" idx="${prefix}:value" style="${
      prefix ? '' : 'display:none'
    }">
        <span class="cmd copy-body" tabindex="-1">复制数组</span>
        <span class="cmd paste-body" tabindex="-1">粘贴数组</span>
      </div>
      <span class="ellipsis"></span>
      <ul class="array collapsible">`,
    hasContents = false

  let vline =
    '<div class="vline"><svg viewBox="64 64 896 896" focusable="false" data-icon="holder" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M300 276.5a56 56 0 1056-97 56 56 0 00-56 97zm0 284a56 56 0 1056-97 56 56 0 00-56 97zM640 228a56 56 0 10112 0 56 56 0 00-112 0zm0 284a56 56 0 10112 0 56 56 0 00-112 0zM300 844.5a56 56 0 1056-97 56 56 0 00-56 97zM640 796a56 56 0 10112 0 56 56 0 00-112 0z"></path></svg></div>'
  data.forEach((item, index) => {
    hasContents = true
    output += `<li><div class="hoverable">${vline}${valueToHTML(
      item,
      index,
      length,
      prefix + '-' + index,
    )}</div></li>`
  })
  output += '</ul>]'

  // if (!hasContents) return '[ ]'

  return output
}

/*
      <div class="operate-item">
        <span role="img" class="cmd add-child" tabindex="-1">新增子项</span>
        <span role="img" class="cmd copy-keyvalue" tabindex="-1">复制(键/值)</span>
        <span role="img" class="cmd copy-body" tabindex="-1">复制(数组/对象)</span>
        <span role="img" class="cmd clear-content" tabindex="-1">清空(数组/对象)</span>
        <span role="img" class="cmd add-before" tabindex="-1">新增(在前)</span>
        <span role="img" class="cmd delete" tabindex="-1">删除</span>
      </div>
*/
function objectToHTML(data, prefix) {
  const arr = Object.entries(data)
  const order = ['fieldType', 'searchType', 'key', 'value']
  if (window.globalEntriesSort) {
    arr.sort((a, b) => {
      const indexA = order.indexOf(a[0])
      const indexB = order.indexOf(b[0])

      if (indexA !== -1 && indexB !== -1) {
        // 如果 a 和 b 都在 order 里，按 order 顺序排序
        return indexA - indexB
      } else if (indexA !== -1) {
        // 只有 a 在 order 里，a 排前面
        return -1
      } else if (indexB !== -1) {
        // 只有 b 在 order 里，b 排前面
        return 1
      } else {
        // 都不在 order 里，按默认顺序排序（即原数组顺序）
        return 0
      }
    })
  }
  const keys = Object.keys(data)
  const length = keys.length

  let output = `<div class="collapser"><i><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></i></div>
      {<select name="type" idx="${prefix}:type" style="${
      prefix ? '' : 'display:none'
    }" class="type-select">
        <option value="string">string</option>
        <option value="object" selected>object</option>
        <option value="array">array</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="undefined">undefined</option>
        <option value="null">null</option>
      </select>
      <div class="operate-item">
      </div>
      <span class="ellipsis"></span>
      <ul class="obj collapsible">`,
    hasContents = false

  let vline =
    '<div class="vline"><svg viewBox="64 64 896 896" focusable="false" data-icon="holder" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M300 276.5a56 56 0 1056-97 56 56 0 00-56 97zm0 284a56 56 0 1056-97 56 56 0 00-56 97zM640 228a56 56 0 10112 0 56 56 0 00-112 0zm0 284a56 56 0 10112 0 56 56 0 00-112 0zM300 844.5a56 56 0 1056-97 56 56 0 00-56 97zM640 796a56 56 0 10112 0 56 56 0 00-112 0z"></path></svg></div>'
  arr.forEach(([key, value], index) => {
    let idx = prefix + '-' + index
    hasContents = true
    output += `<li><div class="hoverable">${vline}`
    output += `<span class="property"><input type="text" idx="${idx}:key" value="${htmlEncode(
      key,
    )}"></span>: ${valueToHTML(value, index, length, idx)}`
    output += '</div></li>'
  })
  output += '</ul>}'
  if (!hasContents) return '{ }'

  return output
}

function jsonToHTML(data, fnName) {
  let output = fnName ? `<div class="callback-function">${fnName}(</div>` : ''
  output += `<div class="jsontree">${valueToHTML(data, null, null, '')}</div>`

  return `${output}${fnName ? '<div class="callback-function">)</div>' : ''}`
}

/*******formatter end*******/

const hashID = (size = 6) => {
  const MASK = 0x3d
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
  const NUMBERS = '1234567890'
  const charset = `${NUMBERS}${LETTERS}${LETTERS.toUpperCase()}_-`.split('')

  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)

  return bytes.reduce((acc, byte) => `${acc}${charset[byte & MASK]}`, '')
}

function onToggle(e, id, $collapser) {
  e.preventDefault()
  e.stopPropagation()
  const $parent = $collapser.parentElement
  if ($parent.id === id) {
    switch ($parent.dataset.status) {
      case 'expanded':
        reduce($collapser)
        break
      case 'reduced':
        expand($collapser)
        break
      default:
        $parent.dataset.status = 'expanded'
        reduce($collapser)
    }
  }
}

function onExpand() {
  for (const $collapsed of collapsers) {
    expand($collapsed)
  }
}

function expand($collapsed) {
  const $parent = $collapsed.parentElement
  if ($parent.dataset.status !== 'reduced') return

  $parent.classList.remove('collapsed')
  $parent.dataset.status = 'expanded'
}

function onReduce() {
  for (const $collapsed of collapsers) {
    reduce($collapsed)
  }
}

function reduce($collapsed) {
  const $parent = $collapsed.parentElement
  if ($parent.dataset.status !== 'expanded') return

  const $ellipsis = $parent.querySelector('.ellipsis')
  if ($ellipsis) $ellipsis.dataset.value = `..${$collapsed.childElementCount}..`
  $parent.classList.add('collapsed')
  $parent.dataset.status = 'reduced'
}
