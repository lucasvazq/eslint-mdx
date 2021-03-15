/* istanbul ignore file */

import { noUnescapedEntities } from './no-unescaped-entities'
import { noUnusedExpressions } from './no-unused-expressions'
import { remark } from './remark'

export * from './helpers'
export * from './types'

export { noUnescapedEntities, noUnusedExpressions, remark }

export const rules = {
  'no-unescaped-entities': noUnescapedEntities,
  'no-unused-expressions': noUnusedExpressions,
  noUnescapedEntities,
  noUnusedExpressions,
  remark,
}
