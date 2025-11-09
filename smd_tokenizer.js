// Smd Tokenizer
// Tokenizes smd source code into tokens

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

function tokenize(smdCode) {
    // Tokenization logic will go here
    // For now, return empty array

    return [];
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize };
}

if (typeof window !== 'undefined') {
    window.SmdTokenizer = { tokenize };
}
