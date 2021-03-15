// based on https://github.com/mdx-js/mdx/blob/master/packages/remark-mdx/tag.js

const dotAllPolyfill = '[\0-\uFFFF]'
const attributeName = '[a-zA-Z_:][a-zA-Z0-9:._-]*'
const unquoted = '[^"\'=<>`\\u0000-\\u0020]+'
const singleQuoted = "'[^']*'"
const doubleQuoted = '"[^"]*"'
const jsProps = '{.*}'.replace('.', dotAllPolyfill)
const attributeValue =
  '(?:' +
  unquoted +
  '|' +
  singleQuoted +
  '|' +
  doubleQuoted +
  '|' +
  jsProps +
  ')'
const attribute =
  '(?:\\s+' + attributeName + '(?:\\s*=\\s*' + attributeValue + ')?)'

export const openTag = '<[A-Za-z]*[A-Za-z0-9\\.\\-]*' + attribute + '*\\s*>'
