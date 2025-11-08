// DASM Runtime
// Top-level interface for the DASM compiler

class DasmRuntime {
    constructor() {
        this.tokenizer = null;
        this.compiler = null;
    }

    /**
     * Compile desmo source code to DASM assembly
     * @param {string} desmoCode - The desmo source code to compile
     * @returns {string} - The compiled DASM assembly code
     */
    compile(desmoCode) {
        // Get the tokenizer and compiler functions
        const tokenize = typeof window !== 'undefined'
            ? window.DesmoTokenizer.tokenize
            : require('./desmo_tokenizer.js').tokenize;

        const compile = typeof window !== 'undefined'
            ? window.DasmCompiler.compile
            : require('./dasm_compiler.js').compile;

        // Tokenize the desmo code
        const tokens = tokenize(desmoCode);

        // Compile tokens to DASM
        const dasmCode = compile(tokens);

        return dasmCode;
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DasmRuntime };
}

if (typeof window !== 'undefined') {
    window.DasmRuntime = DasmRuntime;
}
