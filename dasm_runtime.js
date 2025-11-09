// DASM Runtime
// Top-level interface for the DASM compiler

class DasmRuntime {
    constructor() {
        this.tokenizer = null;
        this.compiler = null;
    }

    /**
     * Compile smd source code to DASM assembly
     * @param {string} smdCode - The smd source code to compile
     * @returns {string} - The compiled DASM assembly code
     */
    compile(smdCode) {
        // Get the tokenizer and compiler functions
        const tokenize = typeof window !== 'undefined'
            ? window.SmdTokenizer.tokenize
            : require('./smd_tokenizer.js').tokenize;

        const compile = typeof window !== 'undefined'
            ? window.DasmCompiler.compile
            : require('./dasm_compiler.js').compile;

        // Tokenize the smd code
        const tokens = tokenize(smdCode);

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
