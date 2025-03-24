/**
 * Adapted the code in to order to run in a web worker.
 *
 * Original author: Benjamin Hollis
 * Maintained by teocci on 11/28/17.
 */
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

function decorateWithSpan(value, className, index, length) {
  // return `<span class="${className}">${htmlEncode(value)}</span>`
  const types = ['number','string','boolean','undefined','symbol','bigint','null']
  return `<div class="type-select-item">
      <select name="type" class="type-select">
        <option value="string" ${className === 'string' ? 'selected' : ''}>string</option>
        <option value="object">object</option>
        <option value="array">array</option>
        <option value="number" ${className === 'number' ? 'selected' : ''}>number</option>
        <option value="boolean" ${className === 'boolean' ? 'selected' : ''}>boolean</option>
        <option value="undefined" ${className === 'undefined' ? 'selected' : ''}>undefined</option>
        <option value="symbol" ${className === 'symbol' ? 'selected' : ''}>symbol</option>
        <option value="bigint" ${className === 'bigint' ? 'selected' : ''}>bigint</option>
        <option value="null" ${className === 'null' ? 'selected' : ''}>null</option>
      </select>
    </div><div class="value-input-item">
      <input type="text" value="${htmlEncode(value)}">
    </div>${addComma(index, length)}<div class="operate-item">
      
    </div>`
}

function valueToHTML(value, index, length) {
  const type = value === null ? 'null' : typeof value
  let output = ''

  switch (type) {
    case 'object':
      output += value && value.constructor === Array ? arrayToHTML(value) : objectToHTML(value)
      break

    case 'number':
      output += decorateWithSpan(value, 'number', index, length)
      break

    case 'string':
      output += decorateWithSpan(`"${value}"`, 'string', index, length)
      break

    case 'boolean':
      output += decorateWithSpan(value, 'boolean', index, length)
      break

    case 'undefined':
      output += decorateWithSpan('undefined', 'undefined', index, length)
      break

    case 'symbol':
      output += decorateWithSpan(value.toString(), 'symbol', index, length)
      break

    case 'bigint':
      output += decorateWithSpan(value.toString(), 'bigint', index, length)
      break

    case 'null':
      output += decorateWithSpan('null', 'null', index, length)
      break

    default:
      // output += decorateWithSpan(type, 'other')
      break
  }

  return output
}

function arrayToHTML(json) {
  const length = json.length
  let output =
      `<div class="collapser"><i><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></i></div>
      <select name="type" class="type-select">
        <option value="string">string</option>
        <option value="object">object</option>
        <option value="array" selected>array</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="undefined">undefined</option>
        <option value="symbol">symbol</option>
        <option value="bigint">bigint</option>
        <option value="null">null</option>
      </select>[ <span class="ellipsis"></span>
      <div class="operate-item">
        <span role="img" class="copy-body" tabindex="-1">复制数组</span>
        <span role="img" class="paste-body" tabindex="-1">粘贴数组</span>
      </div>
      <ul class="array collapsible">`,
    hasContents = false,
    index = 0

  let vline = '<div class="vline"><svg viewBox="64 64 896 896" focusable="false" data-icon="holder" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M300 276.5a56 56 0 1056-97 56 56 0 00-56 97zm0 284a56 56 0 1056-97 56 56 0 00-56 97zM640 228a56 56 0 10112 0 56 56 0 00-112 0zm0 284a56 56 0 10112 0 56 56 0 00-112 0zM300 844.5a56 56 0 1056-97 56 56 0 00-56 97zM640 796a56 56 0 10112 0 56 56 0 00-112 0z"></path></svg></div>' 
  for (const item of json) {
    hasContents = true
    output += `<li><div class="hoverable">${vline}${valueToHTML(item, index, length)}</div></li>`
    index++
  }
  output += '</ul>]'

  if (!hasContents) return '[ ]'

  return output
}

/*
      <div class="operate-item">
        <span role="img" class="add-child" tabindex="-1">新增子项</span>
        <span role="img" class="copy-keyvalue" tabindex="-1">复制(键/值)</span>
        <span role="img" class="copy-body" tabindex="-1">复制(数组/对象)</span>
        <span role="img" class="clear-content" tabindex="-1">清空(数组/对象)</span>
        <span role="img" class="add-before" tabindex="-1">新增(在前)</span>
        <span role="img" class="delete" tabindex="-1">删除</span>
      </div>
*/
function objectToHTML(json) {
  const keys = Object.keys(json)
  const length = keys.length

  let output =
      `<div class="collapser"><i><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></i></div>
      {<select name="type" class="type-select">
        <option value="string">string</option>
        <option value="object" selected>object</option>
        <option value="array">array</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="undefined">undefined</option>
        <option value="symbol">symbol</option>
        <option value="bigint">bigint</option>
        <option value="null">null</option>
      </select>
      <span class="ellipsis"></span>
      <div class="operate-item">
      </div>
      <ul class="obj collapsible">`,
    hasContents = false,
    index = 0

  let vline = '<div class="vline"><svg viewBox="64 64 896 896" focusable="false" data-icon="holder" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M300 276.5a56 56 0 1056-97 56 56 0 00-56 97zm0 284a56 56 0 1056-97 56 56 0 00-56 97zM640 228a56 56 0 10112 0 56 56 0 00-112 0zm0 284a56 56 0 10112 0 56 56 0 00-112 0zM300 844.5a56 56 0 1056-97 56 56 0 00-56 97zM640 796a56 56 0 10112 0 56 56 0 00-112 0z"></path></svg></div>' 
  for (const key of keys) {
    hasContents = true
    output += `<li><div class="hoverable">${vline}`
    output += `<span class="property"><input type="text" value="${htmlEncode(
      key,
    )}"></span>: ${valueToHTML(json[key], index, length)}`
    output += '</div></li>'
    index++
  }
  output += '</ul>}'
  if (!hasContents) return '{ }'

  return output
}

function jsonToHTML(json, fnName) {
  let output = fnName ? `<div class="callback-function">${fnName}(</div>` : ''
  output += `<div id="json">${valueToHTML(json)}</div>`

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
