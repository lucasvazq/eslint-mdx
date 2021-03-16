export function positionFromEstree(value) {
  var node = value || {}
  var loc = node.loc || {}
  var range = node.range || []
  var startOffset = range[0] || node.start

  return {
    start: {
      line: loc.start && loc.start.line > -1 ? loc.start.line : null,
      column: loc.start && loc.start.column > -1 ? loc.start.column + 1 : null,
      offset: startOffset > -1 ? startOffset : null
    },
    end: {
      line: loc.end && loc.end.line > -1 ? loc.end.line : null,
      column: loc.end && loc.end.column > -1 ? loc.end.column + 1 : null,
      offset: range[1] || node.end || null
    }
  }
}
