import type { Linter } from 'eslint'
import type { SourceLocation } from 'estree'
import type { Node, Position } from 'unist'

import type {
  JsxNode,
  MdxNode,
  ParserFn,
  ParserOptions,
  ValueOf,
} from './types'

export const FALLBACK_PARSERS = [
  '@typescript-eslint/parser',
  '@babel/eslint-parser',
  'babel-eslint',
  'espree',
] as const

export const JSX_TYPES = ['JSXElement', 'JSXFragment']

export const isJsxNode = (node: { type: string }): node is JsxNode =>
  JSX_TYPES.includes(node.type)

export const MdxNodeType = {
  FLOW_EXPRESSION: 'mdxFlowExpression',
  JSX_FLOW_ELEMENT: 'mdxJsxFlowElement',
  JSX_TEXT_ELEMENT: 'mdxJsxTextElement',
  TEXT_EXPRESSION: 'mdxTextExpression',
  JS_ESM: 'mdxjsEsm',
} as const

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type MdxNodeType = ValueOf<typeof MdxNodeType>

export const MDX_NODE_TYPES = [
  MdxNodeType.FLOW_EXPRESSION,
  MdxNodeType.JSX_FLOW_ELEMENT,
  MdxNodeType.JSX_TEXT_ELEMENT,
  MdxNodeType.TEXT_EXPRESSION,
  MdxNodeType.JS_ESM,
] as const

export const isMdxNode = (node: Node): node is MdxNode =>
  MDX_NODE_TYPES.includes(node.type as MdxNodeType)

/**
 * @internal
 * only for testing
 */
export const parsersCache = new Map<ParserOptions['parser'], ParserFn[]>()

// eslint-disable-next-line sonarjs/cognitive-complexity
export const normalizeParser = (parser?: ParserOptions['parser']) => {
  if (parsersCache.has(parser)) {
    return parsersCache.get(parser)
  }

  if (parser) {
    const originalParser = parser

    if (typeof parser === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      parser = require(parser) as ParserOptions['parser']
    }

    if (typeof parser === 'object') {
      parser =
        ('parseForESLint' in parser && parser.parseForESLint) ||
        ('parse' in parser && parser.parse)
    }

    if (typeof parser !== 'function') {
      throw new TypeError(`Invalid custom parser for \`eslint-mdx\`: ${parser}`)
    }

    const parsers = [parser]
    parsersCache.set(originalParser, parsers)
    return parsers
  }

  const parsers: ParserFn[] = []

  // try to load FALLBACK_PARSERS automatically
  for (const fallback of FALLBACK_PARSERS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const fallbackParser = require(fallback) as Linter.ParserModule
      /* istanbul ignore next */
      const parserFn =
        'parseForESLint' in fallbackParser
          ? // eslint-disable-next-line @typescript-eslint/unbound-method
            fallbackParser.parseForESLint
          : // eslint-disable-next-line @typescript-eslint/unbound-method
            fallbackParser.parse
      /* istanbul ignore else */
      if (parserFn) {
        parsers.push(parserFn)
      }
    } catch {}
  }

  parsersCache.set(parser, parsers)

  return parsers
}

export interface BaseNode {
  type: string
  loc: SourceLocation
  range: [number, number]
  start?: number
  end?: number
}

export const normalizePosition = (loc: Position): Omit<BaseNode, 'type'> => {
  const start = loc.start.offset
  const end = loc.end.offset
  return {
    range: [start, end],
    loc,
    start,
    end,
  }
}

export const last = <T>(items: T[] | readonly T[]) =>
  items && items[items.length - 1]
