// DASM Compiler - Unified for Node.js and Browser
// Uses Chevrotain for lexing and parsing
// Import Chevrotain - works in both Node.js and browser
import { createToken, Lexer, CstParser } from 'chevrotain';
// ==================== TOKEN DEFINITIONS ====================
// Keywords (must come before Identifier)
const Uniform = createToken({ name: 'Uniform', pattern: /uniform\b/ });
const Return = createToken({ name: 'Return', pattern: /return\b/ });
const For = createToken({ name: 'For', pattern: /for\b/ });
const Switch = createToken({ name: 'Switch', pattern: /switch\b/ });
// Types
const FloatType = createToken({ name: 'FloatType', pattern: /float\b/ });
const IntType = createToken({ name: 'IntType', pattern: /int\b/ });
const Vec2Type = createToken({ name: 'Vec2Type', pattern: /vec2\b/ });
const Vec3Type = createToken({ name: 'Vec3Type', pattern: /vec3\b/ });
const AnyType = createToken({ name: 'AnyType', pattern: /any\b/ });
// Builtins
const Sin = createToken({ name: 'Sin', pattern: /sin\b/ });
const Cos = createToken({ name: 'Cos', pattern: /cos\b/ });
const Tan = createToken({ name: 'Tan', pattern: /tan\b/ });
const Asin = createToken({ name: 'Asin', pattern: /asin\b/ });
const Acos = createToken({ name: 'Acos', pattern: /acos\b/ });
const Atan = createToken({ name: 'Atan', pattern: /atan\b/ });
const Count = createToken({ name: 'Count', pattern: /count\b/ });
const Exp = createToken({ name: 'Exp', pattern: /exp\b/ });
const Log = createToken({ name: 'Log', pattern: /log\b/ });
const Sqrt = createToken({ name: 'Sqrt', pattern: /sqrt\b/ });
const Abs = createToken({ name: 'Abs', pattern: /abs\b/ });
const Min = createToken({ name: 'Min', pattern: /min\b/ });
const Max = createToken({ name: 'Max', pattern: /max\b/ });
const Floor = createToken({ name: 'Floor', pattern: /floor\b/ });
const Ceil = createToken({ name: 'Ceil', pattern: /ceil\b/ });
const E = createToken({ name: 'E', pattern: /e\b/ });
const Pi = createToken({ name: 'Pi', pattern: /pi\b/ });
const Tau = createToken({ name: 'Tau', pattern: /tau\b/ });
// Draw commands
const triangle = createToken({ name: 'triangle', pattern: /triangle\b/ });
// Identifiers and numbers (must come after keywords)
const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
const Number = createToken({ name: 'Number', pattern: /\d+(\.\d+)?/ });
// Operators
const RangeOp = createToken({ name: 'RangeOp', pattern: /\.\.\./ }); // Must come before Dot
const Plus = createToken({ name: 'Plus', pattern: /\+/ });
const Minus = createToken({ name: 'Minus', pattern: /-/ });
const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
const Divide = createToken({ name: 'Divide', pattern: /\// });
const Modulo = createToken({ name: 'Modulo', pattern: /%/ });
const Equals = createToken({ name: 'Equals', pattern: /=/ });
const LessThan = createToken({ name: 'LessThan', pattern: /</ });
const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
const Not = createToken({ name: 'Not', pattern: /!/ });
const Or = createToken({ name: 'Or', pattern: /\|/ });
const Xor = createToken({ name: 'Xor', pattern: /\^/ });
// Punctuation
const LParen = createToken({ name: 'LParen', pattern: /\(/ });
const RParen = createToken({ name: 'RParen', pattern: /\)/ });
const LBrace = createToken({ name: 'LBrace', pattern: /\{/ });
const RBrace = createToken({ name: 'RBrace', pattern: /\}/ });
const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
const Comma = createToken({ name: 'Comma', pattern: /,/ });
const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Dollar = createToken({ name: 'Dollar', pattern: /\$/ });
const Dot = createToken({ name: 'Dot', pattern: /\./ });
// Whitespace and comments
const WhiteSpace = createToken({
    name: 'WhiteSpace',
    pattern: /\s+/,
    group: Lexer.SKIPPED
});
const Comment = createToken({
    name: 'Comment',
    pattern: /\/\/[^\n\r]*/,
    group: Lexer.SKIPPED
});
// Token array - ORDER MATTERS!
const allTokens = [
    // Comments and whitespace first
    WhiteSpace,
    Comment,
    // Keywords (before identifiers)
    Uniform,
    Return,
    For,
    Switch,
    // Types
    FloatType,
    IntType,
    Vec2Type,
    Vec3Type,
    AnyType,
    // Builtins
    Sin, Cos, Tan, Asin, Acos, Atan,
    Count,
    Exp, Log, Sqrt, Abs, Min, Max,
    Floor, Ceil,
    E, Pi, Tau,
    // Draw commands
    triangle,
    // Identifiers and numbers (after keywords)
    Identifier,
    Number,
    // Operators (RangeOp before Dot!)
    RangeOp,
    Plus, Minus, Multiply, Divide, Modulo,
    Equals, LessThan, GreaterThan, Not, Or, Xor,
    // Punctuation
    LParen, RParen,
    LBrace, RBrace,
    LBracket, RBracket,
    Semicolon, Comma, Colon,
    Dollar, Dot
];
const DasmLexer = new Lexer(allTokens);
// ==================== PARSER DEFINITION ====================
class DasmParser extends CstParser {
    constructor() {
        super(allTokens);
        const $ = this;
        // Helper to match any type token
        $.typeTokens = [FloatType, IntType, Vec2Type, Vec3Type, AnyType];
        $.builtinTokens = [Sin, Cos, Tan, Asin, Acos, Atan, Count, Exp, Log, Sqrt, Abs, Min, Max, Floor, Ceil, E, Pi, Tau];
        // ==================== PROGRAM ====================
        $.RULE('program', () => {
            $.MANY(() => {
                $.SUBRULE($.topLevelStatement);
            });
        });
        // ==================== TOP LEVEL ====================
        $.RULE('topLevelStatement', () => {
            $.OR([
                { ALT: () => $.SUBRULE($.uniformDeclaration) },
                { ALT: () => $.SUBRULE($.functionOrVariableDeclaration) },
                { ALT: () => $.SUBRULE($.formattingDirective) },
                { ALT: () => $.SUBRULE($.drawCall) },
                { ALT: () => $.CONSUME(Semicolon) } // Empty statement
            ]);
        });
        $.RULE('uniformDeclaration', () => {
            $.CONSUME(Uniform);
            $.SUBRULE($.typeSpec);
            $.CONSUME(Identifier);
            $.OPTION(() => {
                $.CONSUME(Equals);
                $.SUBRULE($.expression);
            });
            $.CONSUME(Semicolon);
        });
        $.RULE('functionOrVariableDeclaration', () => {
            $.SUBRULE($.typeSpec);
            $.CONSUME(Identifier);
            $.OR([
                { ALT: () => {
                        // Function declaration
                        $.CONSUME(LParen);
                        $.OPTION(() => {
                            $.SUBRULE($.parameterList);
                        });
                        $.CONSUME(RParen);
                        $.SUBRULE($.block);
                    } },
                { ALT: () => {
                        // Variable declaration
                        $.OPTION2(() => {
                            $.CONSUME(Equals);
                            $.SUBRULE($.expression);
                        });
                        $.CONSUME(Semicolon);
                    } }
            ]);
        });
        $.RULE('typeSpec', () => {
            $.OR($.typeTokens.map(token => ({ ALT: () => $.CONSUME(token) })));
            $.OPTION(() => {
                $.CONSUME(LBracket);
                $.CONSUME(RBracket);
            });
        });
        $.RULE('parameterList', () => {
            $.SUBRULE($.parameter);
            $.MANY(() => {
                $.CONSUME(Comma);
                $.SUBRULE2($.parameter);
            });
        });
        $.RULE('parameter', () => {
            $.SUBRULE($.typeSpec);
            $.CONSUME(Identifier);
        });
        $.RULE('formattingDirective', () => {
            $.CONSUME(Dollar);
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
            $.CONSUME2(Identifier); // value
            $.CONSUME(Semicolon);
        });
        $.RULE('drawCall', () => {
            $.CONSUME(triangle);
            $.CONSUME(LParen);
            $.OPTION(() => {
                $.SUBRULE($.argumentList);
            });
            $.CONSUME(RParen);
            $.OPTION2(() => {
                $.CONSUME(Semicolon);
            });
        });
        // ==================== STATEMENTS ====================
        $.RULE('block', () => {
            $.CONSUME(LBrace);
            $.MANY(() => {
                $.SUBRULE($.statement);
            });
            $.CONSUME(RBrace);
        });
        $.RULE('statement', () => {
            $.OR([
                { ALT: () => $.SUBRULE($.returnStatement) },
                { ALT: () => $.SUBRULE($.functionOrVariableDeclaration) },
                { ALT: () => {
                        $.SUBRULE($.expression);
                        $.CONSUME(Semicolon);
                    } }
            ]);
        });
        $.RULE('returnStatement', () => {
            $.CONSUME(Return);
            $.SUBRULE($.expression);
            $.CONSUME(Semicolon);
        });
        // ==================== EXPRESSIONS ====================
        $.RULE('expression', () => {
            $.SUBRULE($.assignmentExpression);
        });
        $.RULE('assignmentExpression', () => {
            $.SUBRULE($.logicalExpression);
            $.OPTION(() => {
                $.CONSUME(Equals);
                $.SUBRULE2($.assignmentExpression); // Right-associative
            });
        });
        $.RULE('logicalExpression', () => {
            $.SUBRULE($.comparisonExpression);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Or) },
                    { ALT: () => $.CONSUME(Xor) }
                ]);
                $.SUBRULE2($.comparisonExpression);
            });
        });
        $.RULE('comparisonExpression', () => {
            $.SUBRULE($.additiveExpression);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(LessThan) },
                    { ALT: () => $.CONSUME(GreaterThan) },
                    { ALT: () => $.CONSUME(Not) }
                ]);
                $.SUBRULE2($.additiveExpression);
            });
        });
        $.RULE('additiveExpression', () => {
            $.SUBRULE($.multiplicativeExpression);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Plus) },
                    { ALT: () => $.CONSUME(Minus) }
                ]);
                $.SUBRULE2($.multiplicativeExpression);
            });
        });
        $.RULE('multiplicativeExpression', () => {
            $.SUBRULE($.unaryExpression);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Multiply) },
                    { ALT: () => $.CONSUME(Divide) },
                    { ALT: () => $.CONSUME(Modulo) }
                ]);
                $.SUBRULE2($.unaryExpression);
            });
        });
        $.RULE('unaryExpression', () => {
            $.OR([
                { ALT: () => {
                        $.OR2([
                            { ALT: () => $.CONSUME(Minus) },
                            { ALT: () => $.CONSUME(Not) }
                        ]);
                        $.SUBRULE($.unaryExpression);
                    } },
                { ALT: () => $.SUBRULE($.postfixExpression) }
            ]);
        });
        $.RULE('postfixExpression', () => {
            $.SUBRULE($.primaryExpression);
            $.MANY(() => {
                $.OR([
                    { ALT: () => {
                            // Member access: .x
                            $.CONSUME(Dot);
                            $.CONSUME(Identifier);
                        } },
                    { ALT: () => {
                            // Index access: [i]
                            $.CONSUME(LBracket);
                            $.SUBRULE($.expression);
                            $.CONSUME(RBracket);
                        } },
                    { ALT: () => {
                            // Function call: (args)
                            $.CONSUME(LParen);
                            $.OPTION(() => {
                                $.SUBRULE($.argumentList);
                            });
                            $.CONSUME(RParen);
                        } }
                ]);
            });
        });
        $.RULE('primaryExpression', () => {
            $.OR([
                { ALT: () => $.SUBRULE($.forExpression) },
                { ALT: () => $.SUBRULE($.switchExpression) },
                { ALT: () => $.CONSUME(Number) },
                { ALT: () => $.CONSUME(Identifier) },
                { ALT: () => $.OR2($.builtinTokens.map(token => ({ ALT: () => $.CONSUME(token) }))) },
                { ALT: () => {
                        // Dollar formatting call
                        $.CONSUME(Dollar);
                        $.CONSUME2(Identifier);
                    } },
                { ALT: () => $.SUBRULE($.parenthesizedOrVector) },
                { ALT: () => $.SUBRULE($.listOrRange) }
            ]);
        });
        $.RULE('parenthesizedOrVector', () => {
            $.CONSUME(LParen);
            $.OPTION(() => {
                $.SUBRULE($.expression);
                $.MANY(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.expression);
                });
            });
            $.CONSUME(RParen);
        });
        $.RULE('listOrRange', () => {
            $.CONSUME(LBracket);
            $.OPTION(() => {
                $.SUBRULE($.expression);
                $.OR([
                    { ALT: () => {
                            // Range: [0...5]
                            $.CONSUME(RangeOp);
                            $.SUBRULE2($.expression);
                        } },
                    { ALT: () => {
                            // List: [1, 2, 3]
                            $.MANY(() => {
                                $.CONSUME(Comma);
                                $.SUBRULE3($.expression);
                            });
                        } }
                ]);
            });
            $.CONSUME(RBracket);
        });
        $.RULE('forExpression', () => {
            $.CONSUME(For);
            $.CONSUME(LParen);
            $.SUBRULE($.forIterator);
            $.MANY(() => {
                $.CONSUME(Comma);
                $.SUBRULE2($.forIterator);
            });
            $.CONSUME(RParen);
            $.SUBRULE($.block);
        });
        $.RULE('forIterator', () => {
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
            $.SUBRULE($.expression);
        });
        $.RULE('switchExpression', () => {
            $.CONSUME(Switch);
            $.CONSUME(LBrace);
            $.MANY(() => {
                $.SUBRULE($.switchCase);
                $.OPTION(() => {
                    $.CONSUME(Comma);
                });
            });
            $.CONSUME(RBrace);
        });
        $.RULE('switchCase', () => {
            $.SUBRULE($.expression);
            $.OPTION(() => {
                $.CONSUME(Colon);
                $.SUBRULE2($.expression);
            });
        });
        $.RULE('argumentList', () => {
            $.SUBRULE($.expression);
            $.MANY(() => {
                $.CONSUME(Comma);
                $.SUBRULE2($.expression);
            });
        });
        this.performSelfAnalysis();
    }
}
// Create parser instance
const parser = new DasmParser();
// ==================== AST BUILDER ====================
const NODE_TYPES = {
    PROGRAM: 'PROGRAM',
    FUNCTION_DECLARATION: 'FUNCTION_DECLARATION',
    VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
    UNIFORM_DECLARATION: 'UNIFORM_DECLARATION',
    FORMATTING_DIRECTIVE: 'FORMATTING_DIRECTIVE',
    DRAW_CALL: 'DRAW_CALL',
    RETURN_STATEMENT: 'RETURN_STATEMENT',
    FOR_EXPRESSION: 'FOR_EXPRESSION',
    PIECEWISE_EXPRESSION: 'PIECEWISE_EXPRESSION',
    PIECEWISE_CASE: 'PIECEWISE_CASE',
    BINARY_EXPRESSION: 'BINARY_EXPRESSION',
    UNARY_EXPRESSION: 'UNARY_EXPRESSION',
    FUNCTION_CALL: 'FUNCTION_CALL',
    IDENTIFIER: 'IDENTIFIER',
    LITERAL: 'LITERAL',
    MEMBER_ACCESS: 'MEMBER_ACCESS',
    VECTOR_LITERAL: 'VECTOR_LITERAL',
    LIST_LITERAL: 'LIST_LITERAL',
    INDEX_ACCESS: 'INDEX_ACCESS',
    ASSIGNMENT: 'ASSIGNMENT',
    EXPRESSION_STATEMENT: 'EXPRESSION_STATEMENT',
    RANGE_EXPRESSION: 'RANGE_EXPRESSION',
};
const BaseCstVisitor = parser.getBaseCstVisitorConstructor();
class AstBuilder extends BaseCstVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }
    program(ctx) {
        const statements = [];
        if (ctx.topLevelStatement) {
            for (const stmt of ctx.topLevelStatement) {
                const node = this.visit(stmt);
                if (node !== null) {
                    statements.push(node);
                }
            }
        }
        return { type: NODE_TYPES.PROGRAM, body: statements };
    }
    topLevelStatement(ctx) {
        if (ctx.Semicolon)
            return null;
        if (ctx.uniformDeclaration)
            return this.visit(ctx.uniformDeclaration);
        if (ctx.functionOrVariableDeclaration)
            return this.visit(ctx.functionOrVariableDeclaration);
        if (ctx.formattingDirective)
            return this.visit(ctx.formattingDirective);
        if (ctx.drawCall)
            return this.visit(ctx.drawCall);
        return null;
    }
    uniformDeclaration(ctx) {
        const type = this.visit(ctx.typeSpec);
        const name = ctx.Identifier[0].image;
        const value = ctx.expression ? this.visit(ctx.expression) : null;
        return {
            type: NODE_TYPES.UNIFORM_DECLARATION,
            uniformType: type.fullType,
            isArray: type.isArray,
            name: name,
            value: value,
            line: ctx.Uniform[0].startLine,
            column: ctx.Uniform[0].startColumn
        };
    }
    functionOrVariableDeclaration(ctx) {
        const type = this.visit(ctx.typeSpec);
        const name = ctx.Identifier[0].image;
        if (ctx.LParen) {
            const params = ctx.parameterList ? this.visit(ctx.parameterList) : [];
            const body = this.visit(ctx.block);
            return {
                type: NODE_TYPES.FUNCTION_DECLARATION,
                returnType: type.fullType,
                isArray: type.isArray,
                name: name,
                params: params,
                body: body,
                line: ctx.Identifier[0].startLine,
                column: ctx.Identifier[0].startColumn
            };
        }
        else {
            const value = ctx.expression ? this.visit(ctx.expression) : null;
            return {
                type: NODE_TYPES.VARIABLE_DECLARATION,
                varType: type.fullType,
                isArray: type.isArray,
                name: name,
                value: value,
                line: ctx.Identifier[0].startLine,
                column: ctx.Identifier[0].startColumn
            };
        }
    }
    typeSpec(ctx) {
        let baseType;
        if (ctx.FloatType)
            baseType = 'float';
        else if (ctx.IntType)
            baseType = 'int';
        else if (ctx.Vec2Type)
            baseType = 'vec2';
        else if (ctx.Vec3Type)
            baseType = 'vec3';
        else if (ctx.AnyType)
            baseType = 'any';
        const isArray = !!ctx.LBracket;
        return {
            baseType: baseType,
            isArray: isArray,
            fullType: isArray ? baseType + '[]' : baseType
        };
    }
    parameterList(ctx) {
        return ctx.parameter.map(p => this.visit(p));
    }
    parameter(ctx) {
        const type = this.visit(ctx.typeSpec);
        return {
            type: type.fullType,
            isArray: type.isArray,
            name: ctx.Identifier[0].image
        };
    }
    formattingDirective(ctx) {
        return {
            type: NODE_TYPES.FORMATTING_DIRECTIVE,
            name: ctx.Identifier[0].image,
            value: ctx.Identifier[1].image,
            line: ctx.Dollar[0].startLine,
            column: ctx.Dollar[0].startColumn
        };
    }
    drawCall(ctx) {
        const args = ctx.argumentList ? this.visit(ctx.argumentList) : [];
        return {
            type: NODE_TYPES.DRAW_CALL,
            command: 'triangle',
            arguments: args,
            line: ctx.triangle[0].startLine,
            column: ctx.triangle[0].startColumn
        };
    }
    block(ctx) {
        const statements = [];
        if (ctx.statement) {
            for (const stmt of ctx.statement) {
                const node = this.visit(stmt);
                if (node)
                    statements.push(node);
            }
        }
        return statements;
    }
    statement(ctx) {
        if (ctx.returnStatement)
            return this.visit(ctx.returnStatement);
        if (ctx.functionOrVariableDeclaration)
            return this.visit(ctx.functionOrVariableDeclaration);
        if (ctx.expression) {
            return {
                type: NODE_TYPES.EXPRESSION_STATEMENT,
                expression: this.visit(ctx.expression)
            };
        }
        return null;
    }
    returnStatement(ctx) {
        return {
            type: NODE_TYPES.RETURN_STATEMENT,
            value: this.visit(ctx.expression),
            line: ctx.Return[0].startLine,
            column: ctx.Return[0].startColumn
        };
    }
    expression(ctx) {
        return this.visit(ctx.assignmentExpression);
    }
    assignmentExpression(ctx) {
        let left = this.visit(ctx.logicalExpression);
        if (ctx.Equals) {
            const right = this.visit(ctx.assignmentExpression[0]);
            return {
                type: NODE_TYPES.ASSIGNMENT,
                left: left,
                right: right,
                line: ctx.Equals[0].startLine,
                column: ctx.Equals[0].startColumn
            };
        }
        return left;
    }
    logicalExpression(ctx) {
        return this.buildBinaryExpression(ctx.comparisonExpression, ctx.Or || ctx.Xor, (op) => op.image);
    }
    comparisonExpression(ctx) {
        return this.buildBinaryExpression(ctx.additiveExpression, ctx.LessThan || ctx.GreaterThan || ctx.Not, (op) => op.image);
    }
    additiveExpression(ctx) {
        return this.buildBinaryExpression(ctx.multiplicativeExpression, ctx.Plus || ctx.Minus, (op) => op.image);
    }
    multiplicativeExpression(ctx) {
        return this.buildBinaryExpression(ctx.unaryExpression, ctx.Multiply || ctx.Divide || ctx.Modulo, (op) => op.image);
    }
    buildBinaryExpression(operands, operators, getOpValue) {
        if (!operators || operators.length === 0) {
            return this.visit(operands[0]);
        }
        let result = this.visit(operands[0]);
        for (let i = 0; i < operators.length; i++) {
            const operator = operators[i];
            const right = this.visit(operands[i + 1]);
            result = {
                type: NODE_TYPES.BINARY_EXPRESSION,
                operator: getOpValue(operator),
                left: result,
                right: right,
                line: operator.startLine,
                column: operator.startColumn
            };
        }
        return result;
    }
    unaryExpression(ctx) {
        if (ctx.Minus || ctx.Not) {
            const op = ctx.Minus ? ctx.Minus[0] : ctx.Not[0];
            return {
                type: NODE_TYPES.UNARY_EXPRESSION,
                operator: op.image,
                operand: this.visit(ctx.unaryExpression),
                line: op.startLine,
                column: op.startColumn
            };
        }
        return this.visit(ctx.postfixExpression);
    }
    postfixExpression(ctx) {
        let expr = this.visit(ctx.primaryExpression);
        const postfixOps = [];
        if (ctx.Dot) {
            for (let i = 0; i < ctx.Dot.length; i++) {
                postfixOps.push({ type: 'member', token: ctx.Dot[i], identifier: ctx.Identifier[i] });
            }
        }
        if (ctx.LBracket) {
            for (let i = 0; i < ctx.LBracket.length; i++) {
                postfixOps.push({ type: 'index', token: ctx.LBracket[i], expr: ctx.expression[i] });
            }
        }
        if (ctx.LParen) {
            for (let i = 0; i < ctx.LParen.length; i++) {
                postfixOps.push({ type: 'call', token: ctx.LParen[i], args: ctx.argumentList ? ctx.argumentList[i] : null });
            }
        }
        postfixOps.sort((a, b) => a.token.startOffset - b.token.startOffset);
        for (const op of postfixOps) {
            if (op.type === 'member') {
                expr = {
                    type: NODE_TYPES.MEMBER_ACCESS,
                    object: expr,
                    property: op.identifier.image,
                    line: op.token.startLine,
                    column: op.token.startColumn
                };
            }
            else if (op.type === 'index') {
                expr = {
                    type: NODE_TYPES.INDEX_ACCESS,
                    object: expr,
                    index: this.visit(op.expr),
                    line: op.token.startLine,
                    column: op.token.startColumn
                };
            }
            else if (op.type === 'call') {
                const funcName = expr.type === NODE_TYPES.IDENTIFIER ? expr.name : null;
                const args = op.args ? this.visit(op.args) : [];
                expr = {
                    type: NODE_TYPES.FUNCTION_CALL,
                    name: funcName,
                    arguments: args,
                    line: op.token.startLine,
                    column: op.token.startColumn
                };
            }
        }
        return expr;
    }
    primaryExpression(ctx) {
        if (ctx.forExpression)
            return this.visit(ctx.forExpression);
        if (ctx.switchExpression)
            return this.visit(ctx.switchExpression);
        if (ctx.Number) {
            return {
                type: NODE_TYPES.IDENTIFIER,
                name: ctx.Number[0].image,
                isNumber: true,
                line: ctx.Number[0].startLine,
                column: ctx.Number[0].startColumn
            };
        }
        if (ctx.Identifier) {
            return {
                type: NODE_TYPES.IDENTIFIER,
                name: ctx.Identifier[0].image,
                line: ctx.Identifier[0].startLine,
                column: ctx.Identifier[0].startColumn
            };
        }
        const builtins = ['Sin', 'Cos', 'Tan', 'Asin', 'Acos', 'Atan', 'Count', 'Exp', 'Log', 'Sqrt', 'Abs', 'Min', 'Max', 'Floor', 'Ceil', 'E', 'Pi', 'Tau'];
        for (const builtin of builtins) {
            if (ctx[builtin]) {
                return {
                    type: NODE_TYPES.IDENTIFIER,
                    name: ctx[builtin][0].image.toLowerCase(),
                    line: ctx[builtin][0].startLine,
                    column: ctx[builtin][0].startColumn
                };
            }
        }
        if (ctx.Dollar) {
            return {
                type: NODE_TYPES.FUNCTION_CALL,
                name: '$' + ctx.Identifier[0].image,
                arguments: [],
                line: ctx.Dollar[0].startLine,
                column: ctx.Dollar[0].startColumn
            };
        }
        if (ctx.parenthesizedOrVector)
            return this.visit(ctx.parenthesizedOrVector);
        if (ctx.listOrRange)
            return this.visit(ctx.listOrRange);
        return null;
    }
    parenthesizedOrVector(ctx) {
        if (!ctx.expression || ctx.expression.length === 0) {
            return {
                type: NODE_TYPES.VECTOR_LITERAL,
                elements: [],
                line: ctx.LParen[0].startLine,
                column: ctx.LParen[0].startColumn
            };
        }
        const elements = ctx.expression.map(e => this.visit(e));
        if (ctx.Comma && ctx.Comma.length > 0) {
            return {
                type: NODE_TYPES.VECTOR_LITERAL,
                elements: elements,
                line: ctx.LParen[0].startLine,
                column: ctx.LParen[0].startColumn
            };
        }
        else {
            return elements[0];
        }
    }
    listOrRange(ctx) {
        if (!ctx.expression || ctx.expression.length === 0) {
            return {
                type: NODE_TYPES.LIST_LITERAL,
                elements: [],
                line: ctx.LBracket[0].startLine,
                column: ctx.LBracket[0].startColumn
            };
        }
        if (ctx.RangeOp) {
            return {
                type: NODE_TYPES.RANGE_EXPRESSION,
                start: this.visit(ctx.expression[0]),
                end: this.visit(ctx.expression[1]),
                line: ctx.LBracket[0].startLine,
                column: ctx.LBracket[0].startColumn
            };
        }
        else {
            return {
                type: NODE_TYPES.LIST_LITERAL,
                elements: ctx.expression.map(e => this.visit(e)),
                line: ctx.LBracket[0].startLine,
                column: ctx.LBracket[0].startColumn
            };
        }
    }
    forExpression(ctx) {
        const iterators = ctx.forIterator.map(it => this.visit(it));
        const body = this.visit(ctx.block);
        return {
            type: NODE_TYPES.FOR_EXPRESSION,
            iterators: iterators,
            body: body,
            line: ctx.For[0].startLine,
            column: ctx.For[0].startColumn
        };
    }
    forIterator(ctx) {
        return {
            variable: ctx.Identifier[0].image,
            range: this.visit(ctx.expression)
        };
    }
    switchExpression(ctx) {
        const cases = ctx.switchCase.map(c => this.visit(c));
        return {
            type: NODE_TYPES.PIECEWISE_EXPRESSION,
            cases: cases,
            line: ctx.Switch[0].startLine,
            column: ctx.Switch[0].startColumn
        };
    }
    switchCase(ctx) {
        const firstExpr = this.visit(ctx.expression[0]);
        if (ctx.Colon) {
            return {
                type: NODE_TYPES.PIECEWISE_CASE,
                test: firstExpr,
                consequent: this.visit(ctx.expression[1])
            };
        }
        else {
            return {
                type: NODE_TYPES.PIECEWISE_CASE,
                test: null,
                consequent: firstExpr
            };
        }
    }
    argumentList(ctx) {
        return ctx.expression.map(e => this.visit(e));
    }
}
const astBuilder = new AstBuilder();
// ==================== MAIN COMPILE FUNCTION ====================
export function go_compile(code) {
    const lexResult = DasmLexer.tokenize(code);
    if (lexResult.errors.length > 0) {
        console.error('Lexer errors:', lexResult.errors);
        throw new Error(`Lexer error: ${lexResult.errors[0].message}`);
    }
    parser.input = lexResult.tokens;
    const cst = parser.program();
    if (parser.errors.length > 0) {
        console.error('Parser errors:', parser.errors);
        throw new Error(`Parser error: ${parser.errors[0].message}`);
    }
    const ast = astBuilder.visit(cst);
    return ast;
}
// Export to window for browser compatibility
if (typeof window !== 'undefined') {
    window.go_compile = go_compile;
}
