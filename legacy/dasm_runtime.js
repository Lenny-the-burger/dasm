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

        // Compile tokens to DASM
        const dasmCode = go_compile(smdCode);

        return dasmCode;
    }
}

// Export for both Node.js and browser
if (typeof window !== 'undefined') {
    window.DasmRuntime = DasmRuntime;
}
