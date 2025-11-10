// Monaco Editor Configuration and Custom Language Setup

let editor;
let currentTab = 'graph.smd';
const readOnlyTabs = ['graph.dasm', 'graph.wat'];

// Tab state management
const tabContents = {
    'graph.smd': `// Simple Example
vec2[] points = [(1,2), (3,4), (5,6)];

any myfunc(any x) {
    any n = x + 3;
    any b = x^2;
    return (x^2 + 2*x + 1) / (n + b);
};

any otherufunc(any x) {
    return x + 2;
};

uniform int size = 5;
$color: black;
vec2[] grid = for (x: [0...size], y: [0...size]) {
    (x, y);
};

vec2[] points_aaa = switch {
    grid.x > 0: [(0,0)],
    grid.y > 0: [(0,0)],
    [(1,1)]
};

polygon(myfunc(points));
`,
    'graph.dasm': `; Assembly-like intermediate representation
; Input parameters: A, B

LOAD R0, A          ; Load A into register R0
LOAD R1, B          ; Load B into register R1

ADD R2, R0, R1      ; R2 = A + B
STORE B, R2         ; B = R2

LOAD R3, #2         ; Load constant 2 into R3
MUL R4, R2, R3      ; R4 = B * 2
STORE C, R4         ; C = R4

LOAD R5, C          ; Load C into R5
SUB R6, R5, R0      ; R6 = C - A
STORE D, R6         ; D = R6

CMP R6, #0          ; Compare D with 0
JGT positive        ; Jump if D > 0
JMP negative        ; Jump to negative

positive:
    LOAD R7, #1
    STORE result, R7
    JMP end

negative:
    LOAD R7, #-1
    STORE result, R7

end:
    HALT            ; End of program`,
    'graph.wat': `(module
  ;; Import memory from JS
  (memory (import "js" "mem") 1)
  
  ;; Add function: returns A + B
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  
  ;; Multiply function: returns A * B
  (func $mul (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.mul
  )
  
  ;; Main computation function
  (func $compute (param $a i32) (param $b i32) (result i32)
    (local $temp i32)
    
    ;; B = A + B
    local.get $a
    local.get $b
    call $add
    local.set $temp
    
    ;; C = B * 2
    local.get $temp
    i32.const 2
    call $mul
    local.set $temp
    
    ;; D = C - A
    local.get $temp
    local.get $a
    i32.sub
    
    ;; Return D
  )
  
  ;; Export functions
  (export "add" (func $add))
  (export "mul" (func $mul))
  (export "compute" (func $compute))
)`
};

// Language mapping for Monaco
const languageMap = {
    'graph.smd': 'smd',
    'graph.dasm': 'plaintext',
    'graph.wat': 'plaintext'
};

// Register custom Smd language
function registerSmdLanguage() {
    // Register the language
    monaco.languages.register({ id: 'smd' });

    // Set language configuration for bracket matching
    monaco.languages.setLanguageConfiguration('smd', {
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' }
        ]
    });

    // Define syntax highlighting rules
    monaco.languages.setMonarchTokensProvider('smd', {
        tokenizer: {
            root: [
                // Comments
                [/\/\/.*$/, 'comment'],
                [/\/\*/, 'comment', '@comment'],

                // Keywords
                [/\b(uniform|for|switch|return)\b/, 'keyword'],

                // Array types (type followed by [])
                [/\b(float|int|vec2|vec3|ivec2|ivec3|uint|uvec2|uvec3|any)\[\]/, 'type.array'],

                // Types
                [/\b(float|int|vec2|vec3|ivec2|ivec3|uint|uvec2|uvec3|any)\b/, 'type'],

                // Formatting directives start with $
                [/^\$[a-zA-Z_]\w*\s*:.*?;/, 'formatting'],

                // Builtins
                [/\b(sin|cos|tan|sqrt|abs|floor|ceil|round|log|ln|exp|polygon|random|min|max)\b/, 'function.builtin'],

                // Function calls and definitions (identifier followed by parentheses)
                [/[a-zA-Z_]\w*(?=\s*\()/, 'function'],

                // Numbers (including decimals)
                [/\b\d+\.?\d*/, 'number'],

                // Operators and comparison
                [/[+\-*/^]/, 'operator'],
                [/[<>=!]=?/, 'operator.comparison'],
                [/\.\.\./, 'operator.spread'],

                // Delimiters
                [/[{}()\[\]]/, 'delimiter.bracket'],
                [/[,;:]/, 'delimiter'],

                // Variables and identifiers
                [/[a-zA-Z_]\w*/, 'variable'],
            ],

            comment: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
        }
    });

    // Define theme with custom colors
    monaco.editor.defineTheme('smd-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'C586C0' },
            { token: 'type', foreground: '569CD6' },
            { token: 'type.array', foreground: '569CD6' },
            { token: 'formatting', foreground: '#8a8a8a' },
            { token: 'function', foreground: 'DCDCAA' },
            { token: 'function.builtin', foreground: '24b3ff' },
            { token: 'variable', foreground: '9cdcfe' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'operator', foreground: 'B4B4B4' },
            { token: 'operator.comparison', foreground: 'B4B4B4' },
            { token: 'operator.spread', foreground: 'B4B4B4' },
            { token: 'delimiter.bracket', foreground: '#cfcfcf' },
            { token: 'delimiter', foreground: 'B4B4B4' },
            { token: 'comment', foreground: '57A64A', fontStyle: 'italic' },
        ],
        colors: {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#dcdcdc',
        }
    });

    // Register autocomplete provider
    monaco.languages.registerCompletionItemProvider('smd', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            // Parse document for user-defined identifiers
            const text = model.getValue();
            const userDefinedSuggestions = [];
            const seenIdentifiers = new Set();

            // Built-in functions to exclude
            const builtins = new Set(['sin', 'cos', 'tan', 'sqrt', 'abs', 'floor', 'ceil',
                'round', 'log', 'ln', 'exp', 'polygon', 'random', 'min', 'max']);
            const keywords = new Set(['uniform', 'for', 'switch']);

            // Match function definitions: name(params) = ...
            const functionPattern = /([a-zA-Z_]\w*)\s*\([^)]*\)\s*=/g;
            let match;
            while ((match = functionPattern.exec(text)) !== null) {
                const name = match[1];
                if (!builtins.has(name) && !keywords.has(name) && !seenIdentifiers.has(name)) {
                    seenIdentifiers.add(name);
                    userDefinedSuggestions.push({
                        label: name,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: name,
                        documentation: 'User-defined function',
                        range: range
                    });
                }
            }

            // Match variable assignments: name = ... (not followed by function params)
            const variablePattern = /(?:^|\n)\s*(?:uniform\s+)?([a-zA-Z_]\w*)\s*=/gm;
            while ((match = variablePattern.exec(text)) !== null) {
                const name = match[1];
                if (!builtins.has(name) && !keywords.has(name) && !seenIdentifiers.has(name)) {
                    // Check if this is actually a function (has parens before =)
                    const beforeEquals = text.substring(Math.max(0, match.index), match.index + match[0].length);
                    if (!beforeEquals.includes('(')) {
                        seenIdentifiers.add(name);
                        userDefinedSuggestions.push({
                            label: name,
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: name,
                            documentation: 'User-defined variable',
                            range: range
                        });
                    }
                }
            }

            const suggestions = [
                // User-defined identifiers first
                ...userDefinedSuggestions,

                // Keywords
                {
                    label: 'uniform',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'uniform ${1:variable} = ${2:value} <${3:min}, ${4:max}, ${5:step}>;',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Declare an interactive uniform variable with range and step',
                    range: range
                },
                {
                    label: 'for',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'public ',
                    documentation: 'List comprehension',
                    range: range
                },
                {
                    label: 'switch',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'private ',
                    documentation: 'Peicewise',
                    range: range
                },

                // Formatting directives
                {
                    label: '$color',
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: '$$color: ${1:blue};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Set the color of the following expression',
                    range: range
                },
                {
                    label: '$thickness',
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: '$$thickness: ${1:1};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Set line thickness',
                    range: range
                },
                {
                    label: '$drag',
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: '$$drag: ${1|all,x,y,none|};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Set drag mode for points',
                    range: range
                },
                {
                    label: '$line',
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: 'line: ${1|solid,dashed,dotted|};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Set line style',
                    range: range
                },

                // Built-in functions
                {
                    label: 'sin',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'sin(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Sine function',
                    range: range
                },
                {
                    label: 'cos',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'cos(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Cosine function',
                    range: range
                },
                {
                    label: 'tan',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'tan(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Tangent function',
                    range: range
                },
                {
                    label: 'sqrt',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'sqrt(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Square root function',
                    range: range
                },
                {
                    label: 'abs',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'abs(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Absolute value function',
                    range: range
                },
                {
                    label: 'log',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'log(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Logarithm base 10',
                    range: range
                },
                {
                    label: 'ln',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'ln(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Natural logarithm',
                    range: range
                },
                {
                    label: 'exp',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'exp(${1:x})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Exponential function (e^x)',
                    range: range
                },
                {
                    label: 'polygon',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'polygon(${1:points})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Create a polygon from list of points',
                    range: range
                },
                {
                    label: 'random',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'random(${1:seed})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Random number generator',
                    range: range
                },
                {
                    label: 'min',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'min(${1:a}, ${2:b})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Minimum of two values',
                    range: range
                },
                {
                    label: 'max',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'max(${1:a}, ${2:b})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Maximum of two values',
                    range: range
                },
            ];

            return { suggestions: suggestions };
        }
    });

    // Register hover provider for documentation
    monaco.languages.registerHoverProvider('smd', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const documentation = {
                'uniform': 'Declares an interactive variable with a slider. Syntax: uniform var = value <min, max, step>;',
                'for': 'List comprehension',
                'switch': 'Peicewise',
                'sin': 'Sine trigonometric function',
                'cos': 'Cosine trigonometric function',
                'tan': 'Tangent trigonometric function',
                'sqrt': 'Square root function',
                'abs': 'Absolute value function',
                'log': 'Logarithm base 10',
                'ln': 'Natural logarithm (base e)',
                'exp': 'Exponential function (e^x)',
                'polygon': 'Creates a polygon from a list of coordinate points',
                'random': 'Generates a random number with optional seed',
                'min': 'Returns the minimum of two values',
                'max': 'Returns the maximum of two values',
                'floor': 'Rounds down to nearest integer',
                'ceil': 'Rounds up to nearest integer',
                'round': 'Rounds to nearest integer',
            };

            const doc = documentation[word.word];
            if (doc) {
                return {
                    range: new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    ),
                    contents: [
                        { value: `**${word.word}**` },
                        { value: doc }
                    ]
                };
            }
            return null;
        }
    });
}

// Initialize Monaco Editor
function initializeEditor() {
    require(['vs/editor/editor.main'], function () {
        // Register the custom language
        registerSmdLanguage();

        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: tabContents[currentTab],
            language: languageMap[currentTab],
            theme: 'smd-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: {
                enabled: false
            },
            scrollBeyondLastLine: true,
            readOnly: readOnlyTabs.includes(currentTab),
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            "bracketPairColorization.enabled": false
        });
    });
}

// Tab switching functionality
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (!editor) return;

            const tabName = tab.textContent;

            // Save current content if editable
            if (!readOnlyTabs.includes(currentTab)) {
                tabContents[currentTab] = editor.getValue();
            }

            // Update active tab styling
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch content
            currentTab = tabName;

            // Update editor content and settings
            const model = editor.getModel();
            monaco.editor.setModelLanguage(model, languageMap[currentTab]);
            editor.setValue(tabContents[currentTab]);
            editor.updateOptions({
                readOnly: readOnlyTabs.includes(currentTab)
            });
        });
    });
}

// Configure Monaco loader
require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeEditor();
        setupTabSwitching();
    });
} else {
    initializeEditor();
    setupTabSwitching();
}