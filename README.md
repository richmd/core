# Richmd v3
<!-- ![NPM](https://img.shields.io/npm/l/richmd)
![npm](https://img.shields.io/npm/v/richmd)
![npm](https://img.shields.io/npm/dw/richmd) -->

## What is Richmd?
Richmd is a tool for making Rich contents Markdown language.

![Richmd](./docs/images/preview.png)

## Installation

```bash
$ pnpm add @richmd/core
```

### Using React
For more details, please see the README of [@richmd/react](https://github.com/richmd/react).

### Using Vue
For more details, please see the README of [@richmd/vue](https://github.com/richmd/vue).

## Retrieve Abstract Syntax Tree (AST) Data
You can retrieve Abstract Syntax Tree (AST) data using the `parseTree` method.
This is useful for customizing code generation on your own.

```js
import { parseTree } from '@richmd/core';

const text = `# aaaa
## aaaaa

**aaaaaa**
`

const ast = parseTree(text);
```


## Markdown Syntax
Please read [Richmd Markdown Syntax Documentation](./docs/md-syntax.md).

### Supported Syntax
- strong
- italic
- image
- link
- headings
- horizontal rule
- blockquote
- unordeed list
- ordered list
- strikethrough
- code block
- checkbox list
- table
- TeX syntax (using [KaTeX](https://katex.org/))
- Color Inline Block
- Dropdown details
- Video(HTML5 Video Tag)
- Custom HTML Tag

## License
MIT

## Thank you :pray:
- [Markdown-tree-parser](https://github.com/ysugimoto/markdown-tree-parser)
  - Richmd's Markdown parser was created using the code in markdown-tree-parser as a reference.
- [KaTeX](https://github.com/KaTeX/KaTeX)
- [highlight.js](https://github.com/highlightjs/highlight.js/)
