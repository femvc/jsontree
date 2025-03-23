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

function decorateWithSpan(value, className) {
  return `<span class="${className}">${htmlEncode(value)}</span>`
}

function valueToHTML(value) {
  const type = value === null ? 'null' : typeof value
  let output = ''

  switch (type) {
    case 'object':
      output += value && value.constructor === Array ? arrayToHTML(value) : objectToHTML(value)

      break

    case 'number':
      output += decorateWithSpan(value, 'type-number')

      break

    case 'string':
      if (/^(http|https):\/\/[^\s]+$/.test(value)) {
        output += `${decorateWithSpan(
          '"',
          'type-string',
        )}<a target="_blank" href="${value}">${htmlEncode(value)}</a>${decorateWithSpan(
          '"',
          'type-string',
        )}`
      } else {
        output += decorateWithSpan(`"${value}"`, 'type-string')
      }
      break

    case 'boolean':
      output += decorateWithSpan(value, 'type-boolean')
      break

    case 'undefined':
      output += decorateWithSpan('undefined', 'type-undefined')
      break

    case 'symbol':
      output += decorateWithSpan(value.toString(), 'type-symbol')
      break

    case 'function':
      output += decorateWithSpan('function', 'type-function')
      break

    case 'bigint':
      output += decorateWithSpan(value.toString(), 'type-bigint')
      break

    case 'null':
      output += decorateWithSpan('null', 'type-null')
      break

    default:
      output += decorateWithSpan(type, 'type-other')
      break
  }

  return output
}

function arrayToHTML(json) {
  const length = json.length
  let output =
      '<div class="collapser"><i><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></i></div>[<span class="ellipsis"></span><ul class="array collapsible">',
    hasContents = false,
    index = 0

  for (const item of json) {
    hasContents = true
    output += `<li><div class="hoverable">${valueToHTML(item)}${addComma(index, length)}</div></li>`
    index++
  }
  output += '</ul>]'

  if (!hasContents) return '[ ]'

  return output
}

function objectToHTML(json) {
  const keys = Object.keys(json)
  const length = keys.length

  let output =
      '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">',
    hasContents = false,
    index = 0

  for (const key of keys) {
    hasContents = true
    output += '<li><div class="hoverable">'
    output += `<span class="property">${htmlEncode(key)}</span>: ${valueToHTML(
      json[key],
    )}${addComma(index, length)}`
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
  if ($ellipsis) $ellipsis.dataset.value = `${$collapsed.childElementCount}`
  $parent.classList.add('collapsed')
  $parent.dataset.status = 'reduced'
}
