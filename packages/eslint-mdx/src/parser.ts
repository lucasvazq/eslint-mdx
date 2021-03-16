/// <reference path="../typings.d.ts" />

import path from 'path'

import type { AST, Linter } from 'eslint'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import unified from 'unified'

import { MDX_NODE_TYPES, normalizeParser, normalizePosition } from './helpers'
import { rehypeRecma } from './plugins/rehype-recma'
import { remarkMarkAndUnravel } from './plugins/remark-mark-and-unravel'
import type { ParserFn, ParserOptions } from './types'

export const mdProcessor = unified().use(remarkParse).freeze()

export const mdxProcessor = mdProcessor().use(remarkMdx).freeze()

export const getEsLintMdxProcessor = (tokens: AST.Token[]) =>
  mdProcessor()
    .use(
      remarkMdx,
      // FIXME: wrong typing of `remark-mdx`
      // @ts-ignore
      {
        acornOptions: {
          locations: true,
          ranges: true,
          onToken: tokens,
        },
      },
    )
    .use(remarkMarkAndUnravel)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      passThrough: [...MDX_NODE_TYPES],
    })
    .use(rehypeRecma)
    .freeze()

export const AST_PROPS = ['body', 'comments'] as const

export const LOC_ERROR_PROPERTIES = ['column', 'lineNumber'] as const

export const DEFAULT_EXTENSIONS: readonly string[] = ['.mdx']
export const MARKDOWN_EXTENSIONS: readonly string[] = ['.md']

export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  comment: true,
  ecmaFeatures: {
    jsx: true,
  },
  ecmaVersion: new Date().getUTCFullYear() as Linter.ParserOptions['ecmaVersion'],
  sourceType: 'module',
  tokens: true,
  filePath: '__placeholder__.mdx',
  // required for @typescript-eslint/parser
  // reference: https://github.com/typescript-eslint/typescript-eslint/pull/2028
  loc: true,
  range: true,
}

export class Parser {
  // @internal
  private _ast: AST.Program

  constructor() {
    this.parse = this.parse.bind(this)
    this.parseForESLint = this.parseForESLint.bind(this)
  }

  parse(code: string, options?: ParserOptions) {
    return this.parseForESLint(code, options).ast
  }

  parseForESLint(
    code: string,
    options?: ParserOptions,
  ): Linter.ESLintParseResult {
    options = { ...DEFAULT_PARSER_OPTIONS, ...options }

    const extname = path.extname(options.filePath)
    const isMdx = DEFAULT_EXTENSIONS.concat(options.extensions || []).includes(
      extname,
    )
    const isMarkdown = MARKDOWN_EXTENSIONS.concat(
      options.markdownExtensions || [],
    ).includes(extname)
    if (!isMdx && !isMarkdown) {
      return this._eslintParse(code, options)
    }

    const tokens: AST.Token[] = []

    const processor = isMdx ? getEsLintMdxProcessor(tokens) : mdProcessor
    const root = processor.runSync(processor.parse(code))

    console.log(JSON.stringify(root, null, 2))

    this._ast = isMdx
      ? ((root as unknown) as AST.Program)
      : {
          ...normalizePosition(root.position),
          type: 'Program',
          sourceType: options.sourceType,
          body: [],
          comments: [],
          tokens,
        }

    this._ast.tokens = tokens

    // if (isMdx) {
    //   traverse(root, node => {
    //     if (!isMdxNode(node)) {
    //       return
    //     }

    //     for (const prop of AST_PROPS) {
    //       // @ts-ignore
    //       this._ast[prop].push(...(node.data?.estree?.[prop] || []))
    //     }
    //   })
    // }

    return { ast: this._ast }
  }

  // @internal
  private _eslintParse(code: string, options: ParserOptions) {
    const parsers = normalizeParser(options.parser)

    let program: ReturnType<ParserFn>
    let parseError: Error
    for (const parser of parsers) {
      try {
        program = parser(code, options)
        break
      } catch (err) {
        if (!parseError) {
          parseError = err as Error
        }
      }
    }

    if (!program && parseError) {
      throw parseError
    }

    /* istanbul ignore next */
    return ('ast' in program && program.ast
      ? program
      : { ast: program }) as Linter.ESLintParseResult
  }
}

export const parser = new Parser()

// eslint-disable-next-line @typescript-eslint/unbound-method
export const { parse, parseForESLint } = parser
