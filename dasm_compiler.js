// DASM Compiler
// Compiles tokens to DASM assembly

var tree = "";

function go_compile(code) {
    var tokens = parse(code);
    console.log("Tokens:", tokens);

    var ast = buildAST(tokens);
    console.log("AST:", ast);

    return tree;
}

const TOKEN_TYPES = {
    TEXT: 'TEXT', // some text that doesnt match, might be a name

    TYPE_DECLARATION: 'TYPE_DECLARATION',
    BUILTIN: 'BUILTIN', // stuff like sin cos etc
    DRAW_COMMAND: 'DRAW_COMMAND', // special top-level drawing commands like polygon
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
    "count",
    "exp", "log", "sqrt", "abs", "min", "max",
    "floor", "ceil",
    "e", "pi", "tau"
];

const DRAW_COMMANDS = [
    "polygon"
];

const OPERARTORS = [
    "+", "-", "*", "/", "=", "<", ">", "!", "|", "^", "%", "..."
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

        // Check for special multi-character operators first
        // Check for ... (range operator)
        if (char === '.' && smdCode[i + 1] === '.' && smdCode[i + 2] === '.') {
            if (currentWord) {
                addWord(currentWord, wordStartLine, wordStartColumn);
                currentWord = "";
            }
            addWord('...', line, column);
            column += 3;
            i += 2; // Skip the next two dots
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

        // draw commands (special top-level builtins)
        if (Object.values(DRAW_COMMANDS).includes(word_lower)) {
            tokens.push(makeToken(TOKEN_TYPES.DRAW_COMMAND, word_lower, wordLine, wordColumn));
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

// AST Node types
const NODE_TYPES = {
    PROGRAM: 'PROGRAM',
    FUNCTION_DECLARATION: 'FUNCTION_DECLARATION',
    VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
    UNIFORM_DECLARATION: 'UNIFORM_DECLARATION',
    FORMATTING_DIRECTIVE: 'FORMATTING_DIRECTIVE',
    DRAW_CALL: 'DRAW_CALL', // Special top-level drawing commands like polygon()
    RETURN_STATEMENT: 'RETURN_STATEMENT',
    FOR_EXPRESSION: 'FOR_EXPRESSION', // List comprehension
    PIECEWISE_EXPRESSION: 'PIECEWISE_EXPRESSION', // Piecewise function (switch)
    PIECEWISE_CASE: 'PIECEWISE_CASE',
    BINARY_EXPRESSION: 'BINARY_EXPRESSION',
    UNARY_EXPRESSION: 'UNARY_EXPRESSION',
    FUNCTION_CALL: 'FUNCTION_CALL',
    IDENTIFIER: 'IDENTIFIER',
    LITERAL: 'LITERAL',
    MEMBER_ACCESS: 'MEMBER_ACCESS',
    VECTOR_LITERAL: 'VECTOR_LITERAL', // (x, y, z)
    LIST_LITERAL: 'LIST_LITERAL', // [1, 2, 3]
    INDEX_ACCESS: 'INDEX_ACCESS', // arr[i]
    ASSIGNMENT: 'ASSIGNMENT',
    EXPRESSION_STATEMENT: 'EXPRESSION_STATEMENT',
    RANGE_EXPRESSION: 'RANGE_EXPRESSION', // [0...size]
};

function makeNode(type, properties) {
    return { type, ...properties };
}

// AST Builder
function buildAST(tokens) {
    let current = 0;

    function peek(offset = 0) {
        return tokens[current + offset] || { type: 'EOF', value: null };
    }

    function advance() {
        return tokens[current++];
    }

    function expect(type, value = null) {
        const token = advance();
        if (token.type !== type || (value !== null && token.value !== value)) {
            throw new Error(
                `Expected ${type}${value ? ` '${value}'` : ''}, got ${token.type} '${token.value}' at line ${token.line}:${token.column}`
            );
        }
        return token;
    }

    function isAtEnd() {
        return current >= tokens.length;
    }

    // Parse the entire program
    function parseProgram() {
        const statements = [];
        while (!isAtEnd()) {
            const stmt = parseTopLevel();
            if (stmt !== null) {
                statements.push(stmt);
            }
        }
        return makeNode(NODE_TYPES.PROGRAM, { body: statements });
    }

    // Parse top-level declarations
    function parseTopLevel() {
        const token = peek();

        // Skip extra semicolons at top level
        if (token.type === TOKEN_TYPES.SEMICOLON) {
            advance();
            return null; // Return null for empty statements
        }

        if (token.type === TOKEN_TYPES.UNIFORM) {
            return parseUniform();
        }

        if (token.type === TOKEN_TYPES.TYPE_DECLARATION) {
            return parseFunctionOrVariable();
        }

        // Handle $ formatting directives at top level
        if (token.type === TOKEN_TYPES.DOLLAR) {
            return parseFormattingDirective();
        }

        // Handle draw commands (like polygon)
        if (token.type === TOKEN_TYPES.DRAW_COMMAND) {
            return parseDrawCall();
        }

        throw new Error(`Unexpected token at top level: ${token.type} '${token.value}' at line ${token.line}:${token.column}`);
    }

    // Helper to parse type with optional array brackets
    function parseType() {
        const type = expect(TOKEN_TYPES.TYPE_DECLARATION);
        let isArray = false;

        // Check for []
        if (peek().type === TOKEN_TYPES.OPEN_SBRACK) {
            advance(); // consume [
            expect(TOKEN_TYPES.CLOSE_SBRACK); // consume ]
            isArray = true;
        }

        return {
            baseType: type.value,
            isArray: isArray,
            fullType: isArray ? type.value + '[]' : type.value
        };
    }

    function parseFormattingDirective() {
        const dollar = advance(); // consume '$'
        const name = expect(TOKEN_TYPES.TEXT);
        expect(TOKEN_TYPES.COLON);

        // Parse the value (could be a simple identifier or more complex)
        const value = expect(TOKEN_TYPES.TEXT);
        expect(TOKEN_TYPES.SEMICOLON);

        return makeNode(NODE_TYPES.FORMATTING_DIRECTIVE, {
            name: name.value,
            value: value.value,
            line: dollar.line,
            column: dollar.column
        });
    }

    function parseDrawCall() {
        const commandToken = advance(); // consume draw command (e.g., 'polygon')
        expect(TOKEN_TYPES.OPEN_BRACK, '(');

        // Parse arguments
        const args = [];
        if (peek().type !== TOKEN_TYPES.CLOSE_BRACK || peek().value !== ')') {
            args.push(parseExpression());
            while (peek().type === TOKEN_TYPES.COMMA) {
                advance(); // consume comma
                args.push(parseExpression());
            }
        }

        expect(TOKEN_TYPES.CLOSE_BRACK, ')');

        // Optional semicolon
        if (peek().type === TOKEN_TYPES.SEMICOLON) {
            advance();
        }

        return makeNode(NODE_TYPES.DRAW_CALL, {
            command: commandToken.value,
            arguments: args,
            line: commandToken.line,
            column: commandToken.column
        });
    }

    function parseUniform() {
        const uniformToken = advance(); // consume 'uniform'
        const type = parseType();
        const name = expect(TOKEN_TYPES.TEXT);

        let value = null;
        if (peek().type === TOKEN_TYPES.OPERATOR && peek().value === '=') {
            advance(); // consume =
            value = parseExpression();
        }

        expect(TOKEN_TYPES.SEMICOLON);

        return makeNode(NODE_TYPES.UNIFORM_DECLARATION, {
            uniformType: type.fullType,
            isArray: type.isArray,
            name: name.value,
            value: value,
            line: uniformToken.line,
            column: uniformToken.column
        });
    }

    function parseFunctionOrVariable() {
        const startLine = peek().line;
        const startColumn = peek().column;
        const type = parseType();
        const name = expect(TOKEN_TYPES.TEXT);

        // Check if it's a function (has opening paren)
        if (peek().type === TOKEN_TYPES.OPEN_BRACK && peek().value === '(') {
            advance(); // consume (
            const params = parseParameters();
            expect(TOKEN_TYPES.CLOSE_BRACK, ')');
            const body = parseBlock();

            return makeNode(NODE_TYPES.FUNCTION_DECLARATION, {
                returnType: type.fullType,
                isArray: type.isArray,
                name: name.value,
                params: params,
                body: body,
                line: startLine,
                column: startColumn
            });
        } else {
            // It's a variable declaration
            let value = null;
            if (peek().type === TOKEN_TYPES.OPERATOR && peek().value === '=') {
                advance(); // consume =
                value = parseExpression();
            }
            expect(TOKEN_TYPES.SEMICOLON);

            return makeNode(NODE_TYPES.VARIABLE_DECLARATION, {
                varType: type.fullType,
                isArray: type.isArray,
                name: name.value,
                value: value,
                line: startLine,
                column: startColumn
            });
        }
    }

    function parseParameters() {
        const params = [];

        while (peek().type !== TOKEN_TYPES.CLOSE_BRACK) {
            const type = parseType();
            const name = expect(TOKEN_TYPES.TEXT);
            params.push({
                type: type.fullType,
                isArray: type.isArray,
                name: name.value
            });

            if (peek().type === TOKEN_TYPES.COMMA) {
                advance();
            }
        }

        return params;
    }

    function parseBlock() {
        expect(TOKEN_TYPES.OPEN_BRACK, '{');
        const statements = [];

        while (peek().type !== TOKEN_TYPES.CLOSE_BRACK || peek().value !== '}') {
            if (isAtEnd()) {
                throw new Error('Unexpected end of file, expected }');
            }
            statements.push(parseStatement());
        }

        expect(TOKEN_TYPES.CLOSE_BRACK, '}');
        return statements;
    }

    function parseStatement() {
        const token = peek();

        if (token.type === TOKEN_TYPES.RETURN) {
            return parseReturnStatement();
        }

        if (token.type === TOKEN_TYPES.TYPE_DECLARATION) {
            return parseFunctionOrVariable(); // Variable in this context
        }

        // Otherwise it's an expression statement
        const expr = parseExpression();
        expect(TOKEN_TYPES.SEMICOLON);
        return makeNode(NODE_TYPES.EXPRESSION_STATEMENT, { expression: expr });
    }

    function parseReturnStatement() {
        const returnToken = advance(); // consume 'return'
        const value = parseExpression();
        expect(TOKEN_TYPES.SEMICOLON);

        return makeNode(NODE_TYPES.RETURN_STATEMENT, {
            value: value,
            line: returnToken.line,
            column: returnToken.column
        });
    }

    // For expression: for (x: range, y: range) { body }
    function parseForExpression() {
        const forToken = advance(); // consume 'for'
        expect(TOKEN_TYPES.OPEN_BRACK, '(');

        // Parse iterators: x: [0...size], y: [0...size]
        const iterators = [];
        while (peek().type !== TOKEN_TYPES.CLOSE_BRACK || peek().value !== ')') {
            if (isAtEnd()) {
                throw new Error('Unexpected end of file in for expression');
            }

            const varName = expect(TOKEN_TYPES.TEXT);
            expect(TOKEN_TYPES.COLON);
            const range = parseExpression(); // This will parse [0...size]

            iterators.push({
                variable: varName.value,
                range: range
            });

            if (peek().type === TOKEN_TYPES.COMMA) {
                advance();
            }
        }

        expect(TOKEN_TYPES.CLOSE_BRACK, ')');

        // Parse body block
        const body = parseBlock();

        return makeNode(NODE_TYPES.FOR_EXPRESSION, {
            iterators: iterators,
            body: body,
            line: forToken.line,
            column: forToken.column
        });
    }

    // Switch expression: switch { test: value, test: value, default }
    function parseSwitchExpression() {
        const switchToken = advance(); // consume 'switch'
        expect(TOKEN_TYPES.OPEN_BRACK, '{');

        const cases = [];
        while (peek().type !== TOKEN_TYPES.CLOSE_BRACK || peek().value !== '}') {
            if (isAtEnd()) {
                throw new Error('Unexpected end of file in switch expression');
            }

            // Try to parse "test: consequent" or just "default_value"
            const firstExpr = parseExpression();

            // Check if there's a colon (meaning this is test: consequent)
            if (peek().type === TOKEN_TYPES.COLON) {
                advance(); // consume :
                const consequent = parseExpression();
                cases.push(makeNode(NODE_TYPES.PIECEWISE_CASE, {
                    test: firstExpr,
                    consequent: consequent
                }));
            } else {
                // No colon means this is the default case
                cases.push(makeNode(NODE_TYPES.PIECEWISE_CASE, {
                    test: null, // null means default
                    consequent: firstExpr
                }));
            }

            // Cases are separated by commas
            if (peek().type === TOKEN_TYPES.COMMA) {
                advance();
            }
        }

        expect(TOKEN_TYPES.CLOSE_BRACK, '}');

        return makeNode(NODE_TYPES.PIECEWISE_EXPRESSION, {
            cases: cases,
            line: switchToken.line,
            column: switchToken.column
        });
    }

    function parseExpression() {
        return parseAssignment();
    }

    function parseAssignment() {
        let left = parseLogical();

        if (peek().type === TOKEN_TYPES.OPERATOR && peek().value === '=') {
            const operator = advance();
            const right = parseAssignment(); // Right-associative
            return makeNode(NODE_TYPES.ASSIGNMENT, {
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            });
        }

        return left;
    }

    function parseLogical() {
        let left = parseComparison();

        while (peek().type === TOKEN_TYPES.OPERATOR && ['|', '^'].includes(peek().value)) {
            const operator = advance();
            const right = parseComparison();
            left = makeNode(NODE_TYPES.BINARY_EXPRESSION, {
                operator: operator.value,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            });
        }

        return left;
    }

    function parseComparison() {
        let left = parseAdditive();

        while (peek().type === TOKEN_TYPES.OPERATOR && ['<', '>', '!'].includes(peek().value)) {
            const operator = advance();
            const right = parseAdditive();
            left = makeNode(NODE_TYPES.BINARY_EXPRESSION, {
                operator: operator.value,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            });
        }

        return left;
    }

    function parseAdditive() {
        let left = parseMultiplicative();

        while (peek().type === TOKEN_TYPES.OPERATOR && ['+', '-'].includes(peek().value)) {
            const operator = advance();
            const right = parseMultiplicative();
            left = makeNode(NODE_TYPES.BINARY_EXPRESSION, {
                operator: operator.value,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            });
        }

        return left;
    }

    function parseMultiplicative() {
        let left = parseUnary();

        while (peek().type === TOKEN_TYPES.OPERATOR && ['*', '/', '%'].includes(peek().value)) {
            const operator = advance();
            const right = parseUnary();
            left = makeNode(NODE_TYPES.BINARY_EXPRESSION, {
                operator: operator.value,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            });
        }

        return left;
    }

    function parseUnary() {
        const token = peek();

        // Unary operators: -, !
        if (token.type === TOKEN_TYPES.OPERATOR && ['-', '!'].includes(token.value)) {
            const operator = advance();
            const operand = parseUnary(); // Right-associative
            return makeNode(NODE_TYPES.UNARY_EXPRESSION, {
                operator: operator.value,
                operand: operand,
                line: operator.line,
                column: operator.column
            });
        }

        return parsePostfix();
    }

    function parsePostfix() {
        let expr = parsePrimary();

        while (true) {
            const token = peek();

            // Member access: vec.x
            if (token.type === TOKEN_TYPES.DOT) {
                advance(); // consume .
                const member = expect(TOKEN_TYPES.TEXT);
                expr = makeNode(NODE_TYPES.MEMBER_ACCESS, {
                    object: expr,
                    property: member.value,
                    line: token.line,
                    column: token.column
                });
            }
            // Index access: arr[i]
            else if (token.type === TOKEN_TYPES.OPEN_SBRACK) {
                advance(); // consume [
                const index = parseExpression();
                expect(TOKEN_TYPES.CLOSE_SBRACK);
                expr = makeNode(NODE_TYPES.INDEX_ACCESS, {
                    object: expr,
                    index: index,
                    line: token.line,
                    column: token.column
                });
            }
            // Function call: func(args)
            else if (token.type === TOKEN_TYPES.OPEN_BRACK && token.value === '(') {
                // Only if expr is an identifier (and not a number!)
                if (expr.type === NODE_TYPES.IDENTIFIER && !expr.isNumber) {
                    advance(); // consume (
                    const args = parseArguments();
                    expect(TOKEN_TYPES.CLOSE_BRACK, ')');
                    expr = makeNode(NODE_TYPES.FUNCTION_CALL, {
                        name: expr.name,
                        arguments: args,
                        line: token.line,
                        column: token.column
                    });
                } else {
                    break;
                }
            }
            else {
                break;
            }
        }

        return expr;
    }

    function parsePrimary() {
        const token = peek();

        // For expression (list comprehension)
        if (token.type === TOKEN_TYPES.FOR) {
            return parseForExpression();
        }

        // Switch expression (piecewise)
        if (token.type === TOKEN_TYPES.SWITCH) {
            return parseSwitchExpression();
        }

        // Identifiers and numbers
        if (token.type === TOKEN_TYPES.TEXT) {
            const name = advance();
            // Check if it's a number (starts with digit)
            const isNumber = /^\d/.test(name.value);
            return makeNode(NODE_TYPES.IDENTIFIER, {
                name: name.value,
                isNumber: isNumber,
                line: name.line,
                column: name.column
            });
        }

        // Builtins (sin, cos, etc.) - treat as identifiers that will be called
        if (token.type === TOKEN_TYPES.BUILTIN) {
            const builtin = advance();
            return makeNode(NODE_TYPES.IDENTIFIER, {
                name: builtin.value,
                line: builtin.line,
                column: builtin.column
            });
        }

        // $ formatting call
        if (token.type === TOKEN_TYPES.DOLLAR) {
            const dollar = advance();
            const name = expect(TOKEN_TYPES.TEXT);
            return makeNode(NODE_TYPES.FUNCTION_CALL, {
                name: '$' + name.value,
                arguments: [],
                line: dollar.line,
                column: dollar.column
            });
        }

        // Parenthesized expression or vector literal
        if (token.type === TOKEN_TYPES.OPEN_BRACK && token.value === '(') {
            const openParen = advance(); // consume (

            // Empty parens? Probably an error but let's handle it
            if (peek().type === TOKEN_TYPES.CLOSE_BRACK && peek().value === ')') {
                advance();
                return makeNode(NODE_TYPES.VECTOR_LITERAL, {
                    elements: [],
                    line: openParen.line,
                    column: openParen.column
                });
            }

            const firstExpr = parseExpression();

            // Check if it's a vector literal (has comma) or just grouped expression
            if (peek().type === TOKEN_TYPES.COMMA) {
                const elements = [firstExpr];
                while (peek().type === TOKEN_TYPES.COMMA) {
                    advance(); // consume ,
                    elements.push(parseExpression());
                }
                expect(TOKEN_TYPES.CLOSE_BRACK, ')');
                return makeNode(NODE_TYPES.VECTOR_LITERAL, {
                    elements: elements,
                    line: openParen.line,
                    column: openParen.column
                });
            } else {
                // Just a grouped expression
                expect(TOKEN_TYPES.CLOSE_BRACK, ')');
                return firstExpr;
            }
        }

        // List literal: [1, 2, 3] or Range: [0...size]
        if (token.type === TOKEN_TYPES.OPEN_SBRACK) {
            const openBracket = advance(); // consume [

            // Check for empty list
            if (peek().type === TOKEN_TYPES.CLOSE_SBRACK) {
                advance();
                return makeNode(NODE_TYPES.LIST_LITERAL, {
                    elements: [],
                    line: openBracket.line,
                    column: openBracket.column
                });
            }

            // Parse first element
            const firstElement = parseExpression();

            // Check for range operator: ...
            if (peek().type === TOKEN_TYPES.OPERATOR && peek().value === '...') {
                advance(); // consume ...
                const end = parseExpression();
                expect(TOKEN_TYPES.CLOSE_SBRACK);
                return makeNode(NODE_TYPES.RANGE_EXPRESSION, {
                    start: firstElement,
                    end: end,
                    line: openBracket.line,
                    column: openBracket.column
                });
            }

            // Otherwise it's a list literal
            const elements = [firstElement];
            while (peek().type === TOKEN_TYPES.COMMA) {
                advance(); // consume ,
                if (peek().type === TOKEN_TYPES.CLOSE_SBRACK) {
                    break; // Trailing comma
                }
                elements.push(parseExpression());
            }

            expect(TOKEN_TYPES.CLOSE_SBRACK);
            return makeNode(NODE_TYPES.LIST_LITERAL, {
                elements: elements,
                line: openBracket.line,
                column: openBracket.column
            });
        }

        throw new Error(`Unexpected token in expression: ${token.type} '${token.value}' at line ${token.line}:${token.column}`);
    }

    function parseArguments() {
        const args = [];

        while (peek().type !== TOKEN_TYPES.CLOSE_BRACK) {
            if (isAtEnd()) {
                throw new Error('Unexpected end of file in argument list');
            }
            args.push(parseExpression());
            if (peek().type === TOKEN_TYPES.COMMA) {
                advance();
            }
        }

        return args;
    }

    return parseProgram();
}

// Export go_compile to global scope for browser
if (typeof window !== 'undefined') {
    window.go_compile = go_compile;
    window.getTree = () => tree;
}
