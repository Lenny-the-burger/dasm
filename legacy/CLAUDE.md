# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DASM is a compiler for the SMD (Smds) language - a functional, SIMD-first assembly language designed for mathematical graphics and data visualization. The project compiles SMD source code into an AST (Abstract Syntax Tree) that will eventually be lowered to WASM, machine code, or GPU shaders.

The language features:
- Vector types (vec2, vec3) and operations
- Functional programming style with immutable variables
- For-loops with list comprehensions: `for (x: [0...size], y: [0...size]) { (x, y) }`
- Piecewise expressions (switch statements): `switch { condition: value, default_value }`
- Drawing primitives (currently just `triangle()`)
- Uniform variables for runtime-configurable values
- Automatic type inference with `any` type

## Architecture

### Compilation Pipeline

1. **Lexing & Parsing** (`dasm_compiler.mjs`): Uses Chevrotain to tokenize and parse SMD source code
2. **AST Construction** (`dasm_compiler.mjs`): CST visitor pattern transforms parse tree into AST
3. **Future stages** (not yet implemented): AST → DASM assembly → WASM/machine code/shaders

### Key Components

**Compiler (`dasm_compiler.mjs`):**
- Unified ES module that works in both Node.js and browser environments
- Uses Chevrotain lexer and parser (not hand-written parser)
- Defines all tokens (keywords, operators, types, builtins) with precedence ordering
- `DasmParser` class extends `CstParser` with grammar rules for SMD syntax
- `AstBuilder` class visits CST nodes and constructs typed AST nodes
- Exports `go_compile(code)` function that returns an AST

**Web Application:**
- `index.html`: Main page with Monaco editor, canvas, and compilation UI
- `dasm_runtime.js`: Thin wrapper around `go_compile()` for browser usage
- `editor.js`: Monaco editor configuration with multi-tab support
- `canvas.js`: Canvas rendering (currently minimal)
- Import maps allow Chevrotain to load from unpkg CDN in browser

**Node.js Harness (`node_cmpl.js`):**
- Simple test script that compiles example SMD code
- Writes AST output to `output/output.dasm` as JSON

## Common Commands

### Testing/Compilation
```bash
npm test
# or
npm run compile
```
Both commands run `node_cmpl.js` which compiles the example SMD code and outputs AST to `output/output.dasm`.

### Development Server
```bash
npm run dev
```
Starts http-server on port 8000 and opens browser to test the web interface.

### Browser Usage
Open `index.html` directly in a browser. The compiler loads as an ES module via import maps (Chevrotain from unpkg CDN).

### Programmatic Usage (Node.js)
```javascript
import { go_compile } from './dasm_compiler.mjs';
const ast = go_compile(smdCode);
```

## Important Implementation Details

### Token Ordering
Token order in `allTokens` array is critical:
- Keywords MUST come before `Identifier` (otherwise "uniform" matches as identifier)
- `RangeOp` (`...`) MUST come before `Dot` (`.`) to match correctly
- Builtins (sin, cos, etc.) must come before `Identifier`

### AST Node Types
All node types defined in `NODE_TYPES` object:
- Program structure: `PROGRAM`, `FUNCTION_DECLARATION`, `VARIABLE_DECLARATION`, `UNIFORM_DECLARATION`
- Control flow: `FOR_EXPRESSION`, `PIECEWISE_EXPRESSION` (switch), `RETURN_STATEMENT`
- Expressions: `BINARY_EXPRESSION`, `UNARY_EXPRESSION`, `FUNCTION_CALL`, `ASSIGNMENT`
- Literals: `IDENTIFIER`, `LITERAL`, `VECTOR_LITERAL`, `LIST_LITERAL`, `RANGE_EXPRESSION`
- Access: `MEMBER_ACCESS` (`.x`), `INDEX_ACCESS` (`[i]`)

### Memory Model (Future)
SMD uses a SIMD-first, functional memory model:
- No runtime allocation - all memory statically allocated
- Variables are immutable (destructive writes)
- Data layout: [static data][function returns][temporary allocations][output buffers]
- Designed for parallelization and GPU compilation

### Special Syntax
- Vector literals: `(1, 2)` or `(x, y, z)`
- List literals: `[1, 2, 3]`
- Ranges: `[0...5]` (includes 0, excludes 5)
- Member access: `vec.x`, `vec.y`
- For loops: `for (var: iterable) { body }`
- Switch/piecewise: `switch { test: value, test: value, default }`
- Formatting directives: `$color: black;` (ignored in compilation)

## Language File Extension

The language is called "SMD" (Smds) and uses `.smd` extension for source files. The compiler outputs to `.dasm` (DASM assembly, currently just AST JSON).

## Deployment

The project deploys to Cloudflare Pages at https://dasm.pages.dev/
