// DASM Compiler
// Compiles tokens to DASM assembly

var tree = "";

function go_compile(code) {
    var parsed_code = parse(code);
    console.log(parsed_code);

    return tree;
}

const TOKEN_TYPES = {
    TEXT: 'TEXT', // some text that doesnt match, might be a name

    TYPE_DECLARATION: 'TYPE_DECLARATION',
    BUILTIN: 'BUILTIN', // stuff like sin cos etc
    OPERATOR: 'OPERATOR',

    UNIFORM: 'UNIFORM',

    // theres only a couple control flow statements
    RETURN: 'RETURN',
    FOR: 'FOR',
    SWITCH: 'SWITCH',

    // brackets
    OPEN_BRACK: 'OPEN_BRACK',
    CLOSE_BRACK: 'CLOSE_BRACK',
    OPEN_SBRACK: 'OPEN_SBRACK',
    CLOSE_SBRACK: 'CLOSE_SBRACK',

    // misc
    COMMA: 'COMMA', // these are special (and annoying!)
    COLON: 'COLON',
    SEMICOLON: 'SEMICOLON',
    DOLLAR: 'DOLLAR', // formatting calls
    DOT: 'DOT', // this is only for acessing vecs
}

const TYPES = [
    "float", "int", "vec2", "vec3", "any"
];

const BUILTINS = [
    "sin", "cos", "tan", "asin", "acos", "atan",
    "polygon", "count",
    "exp", "log", "sqrt", "abs", "min", "max",
    "floor", "ceil",
    "e", "pi", "tau"
];

const OPERARTORS = [
    "+", "-", "*", "/", "=", "<", ">", "!", "|", "^", ",", "%", "..."
];

function makeToken(type, value, line, column) {
    return {
        type: type,
        value: value,
        line: line,
        column: column
    };
}

function parse(smdCode) {
    // Build a position map as we go through the original source
    var line = 1;
    var column = 1;
    var position = 0;

    // Create position-tagged words by walking through the original source
    var positionedWords = [];
    var currentWord = "";
    var wordStartLine = 1;
    var wordStartColumn = 1;

    // First pass: split while tracking positions
    function addWord(word, line, col) {
        if (word) {
            positionedWords.push({ text: word, line: line, column: col });
        }
    }

    // Track position character by character
    for (let i = 0; i < smdCode.length; i++) {
        const char = smdCode[i];
        const nextChar = smdCode[i + 1];

        // Check for comments
        if (char === '/' && nextChar === '/') {
            if (currentWord) {
                addWord(currentWord, wordStartLine, wordStartColumn);
                currentWord = "";
            }

            // Find the end of the comment (end of line)
            let commentStart = i;
            let commentStartCol = column;
            while (i < smdCode.length && smdCode[i] !== '\n' && !(smdCode[i] === '\r' && smdCode[i + 1] === '\n')) {
                i++;
                column++;
            }
            // Don't include the newline in the comment
            i--; // Back up one so the newline gets processed normally
            column--;
            continue;
        }

        // Check for newlines
        if (char === '\n' || (char === '\r' && nextChar === '\n')) {
            if (currentWord) {
                addWord(currentWord, wordStartLine, wordStartColumn);
                currentWord = "";
            }

            // Add newline as its own word
            addWord(char === '\r' ? '\r\n' : '\n', line, column);

            line++;
            column = 1;
            if (char === '\r') i++; // skip the \n in \r\n
            continue;
        }

        // Check for whitespace (space or tab)
        if (char === ' ' || char === '\t') {
            if (currentWord) {
                addWord(currentWord, wordStartLine, wordStartColumn);
                currentWord = "";
            }
            column++;
            continue;
        }

        // Check for special characters that should be their own tokens
        const isSpecial = /[\{\}\(\)\[\];,\+\-\*\/=\<\>\!\|\^%\.\:\$]/.test(char);

        if (isSpecial) {
            if (currentWord) {
                addWord(currentWord, wordStartLine, wordStartColumn);
                currentWord = "";
            }
            addWord(char, line, column);
            column++;
            continue;
        }

        // Regular character - add to current word
        if (!currentWord) {
            wordStartLine = line;
            wordStartColumn = column;
        }
        currentWord += char;
        column++;
    }

    // Don't forget the last word
    if (currentWord) {
        addWord(currentWord, wordStartLine, wordStartColumn);
    }

    var tokens = [];

    for (let wordObj of positionedWords) {
        let word = wordObj.text;
        let wordLine = wordObj.line;
        let wordColumn = wordObj.column;

        // Actual parsing starts here
        var word_lower = word.toLowerCase();

        // professional compiler developer here

        // types
        if (Object.values(TYPES).includes(word_lower)) {
            tokens.push(makeToken(TOKEN_TYPES.TYPE_DECLARATION, word_lower, wordLine, wordColumn));
            continue;
        }

        // builtins
        if (Object.values(BUILTINS).includes(word_lower)) {
            tokens.push(makeToken(TOKEN_TYPES.BUILTIN, word_lower, wordLine, wordColumn));
            continue;
        }

        // operators
        if (Object.values(OPERARTORS).includes(word_lower)) {
            tokens.push(makeToken(TOKEN_TYPES.OPERATOR, word_lower, wordLine, wordColumn));
            continue;
        }

        // control flow keywords
        if (word_lower === "return") {
            tokens.push(makeToken(TOKEN_TYPES.RETURN, word_lower, wordLine, wordColumn));
            continue;
        }

        if (word_lower === "for") {
            tokens.push(makeToken(TOKEN_TYPES.FOR, word_lower, wordLine, wordColumn));
            continue;
        }

        if (word_lower === "switch") {
            tokens.push(makeToken(TOKEN_TYPES.SWITCH, word_lower, wordLine, wordColumn));
            continue;
        }

        // uniform keyword
        if (word_lower === "uniform") {
            tokens.push(makeToken(TOKEN_TYPES.UNIFORM, word_lower, wordLine, wordColumn));
            continue;
        }

        // brackets
        if (word === "{" || word === "(") {
            tokens.push(makeToken(TOKEN_TYPES.OPEN_BRACK, word, wordLine, wordColumn));
            continue;
        }

        if (word === "}" || word === ")") {
            tokens.push(makeToken(TOKEN_TYPES.CLOSE_BRACK, word, wordLine, wordColumn));
            continue;
        }

        if (word === "[") {
            tokens.push(makeToken(TOKEN_TYPES.OPEN_SBRACK, word, wordLine, wordColumn));
            continue;
        }

        if (word === "]") {
            tokens.push(makeToken(TOKEN_TYPES.CLOSE_SBRACK, word, wordLine, wordColumn));
            continue;
        }

        // misc symbols
        if (word === ",") {
            tokens.push(makeToken(TOKEN_TYPES.COMMA, word, wordLine, wordColumn));
            continue;
        }

        if (word === ":") {
            tokens.push(makeToken(TOKEN_TYPES.COLON, word, wordLine, wordColumn));
            continue;
        }

        if (word === ";") {
            tokens.push(makeToken(TOKEN_TYPES.SEMICOLON, word, wordLine, wordColumn));
            continue;
        }

        if (word === "$") {
            tokens.push(makeToken(TOKEN_TYPES.DOLLAR, word, wordLine, wordColumn));
            continue;
        }

        if (word === ".") {
            tokens.push(makeToken(TOKEN_TYPES.DOT, word, wordLine, wordColumn));
            continue;
        }

        // skip newlines
        if (word === "\n" || word === "\r\n") {
            continue;
        }

        // anything else is text (identifiers, numbers, etc.)
        tokens.push(makeToken(TOKEN_TYPES.TEXT, word, wordLine, wordColumn));
    }

    return tokens;
}



// Export go_compile to global scope for browser
if (typeof window !== 'undefined') {
    window.go_compile = go_compile;
    window.getTree = () => tree;
}
