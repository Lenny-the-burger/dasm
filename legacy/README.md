# dasm

Smds assembly

Currently this deploys via cloudflare pages at https://dasm.pages.dev/

## Architecture

This project uses [Chevrotain](https://chevrotain.io/) for parsing the DASM language.

### File Structure

**Compiler:**
- `dasm_compiler.mjs` - Unified Chevrotain parser (works in both Node.js and browser)

**Application:**
- `index.html` - Main HTML page
- `dasm_runtime.js` - Runtime execution engine
- `editor.js` - Monaco editor configuration
- `canvas.js` - Canvas rendering logic
- `node_cmpl.js` - Node.js test harness

### Development

**Testing:**
```bash
npm test
# or
npm run compile
```

**Browser Usage:**
Open `index.html` in a browser. The compiler loads as an ES module and imports Chevrotain from unpkg CDN via import maps.

**Node.js Usage:**
```javascript
import { go_compile } from './dasm_compiler.mjs';

const ast = go_compile(sourceCode);
```
