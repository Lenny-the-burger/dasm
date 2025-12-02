// @ts-ignore
import { simd, relaxedSimd } from "https://unpkg.com/wasm-feature-detect@1.8.0/dist/esm/index.js";

enum SectionType {
    NONE,
    DATA,
    FUNCTIONS,
    PROGRAM
}

enum DataType {
    NUM = "num",
    VEC2 = "vec2",
    VEC3 = "vec3"
}

enum TemplateSpecifier {
    ANY = "any",
    VECN = "vecn"
}

// These are actually the only three data types. Everything else is just template declarations.
type dataNum = {
    value: number;
}

type dataVec2 = {
    value: [number, number];
}

type dataVec3 = {
    value: [number, number, number];
}

// regular vs list variables
type singletDataVar<T> = {
    name: string;
    value: T;
}

type dataListVar<T> = {
    name: string;
    values: T[];
}


enum BinaryOp {
    ADD = "+",
    SUB = "-",
    MUL = "*",
    DIV = "/"
}

enum InstrName {
    // arithmetic
    ADD = "add",
    SUB = "sub",
    MUL = "mul",
    DIV = "div",
    POW = "pow",
    ABS = "abs",
    SQRT = "sqrt",

    DOT = "dot",
    CROSS = "cross",
    MAGNITUDE = "magnitude",

    CALL = "call",
    RET = "ret",

    MIN = "min",
    MAX = "max",
    TOTAL = "total",
    COUNT = "count"
}

// How does this instruction interact with vectors. Note that is NOT the vec2/vec3 data type, but the lists.
enum BroadcastType {
    ELEMENTS, // broadcast across elements of a vector, most common
    NONE, // stuff like ret or call that cant broadcast
    REDUCE // reduce a vector to a scalar, things like total, min, max etc
}

interface TypeInteraction {
    input_types: DataType[];
    return_type: DataType | null; // if null, void/no return value
}

interface InstructionSignature {
    name: InstrName;
    validTypeInteractions: TypeInteraction[];
    broadcast_type: BroadcastType;
}

const INSTRUCTION_REGISTRY: Map<InstrName, InstructionSignature> = new Map([
    // Binary arithmetic - same types only
    [InstrName.ADD, {
        name: InstrName.ADD,
        validTypeInteractions: [
            { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
            { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.VEC2 },
            { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],
    [InstrName.SUB, {
        name: InstrName.SUB,
        validTypeInteractions: [
            { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
            { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.VEC2 },
            { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],
    [InstrName.DIV, {
        name: InstrName.DIV,
        validTypeInteractions: [
            { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Multiplication - supports scalar broadcasting
    [InstrName.MUL, {
        name: InstrName.MUL,
        validTypeInteractions: [
            { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
            // Scalar multiplication
            { input_types: [DataType.NUM, DataType.VEC2], return_type: DataType.VEC2 },
            { input_types: [DataType.NUM, DataType.VEC3], return_type: DataType.VEC3 }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Power
    [InstrName.POW, {
        name: InstrName.POW,
        validTypeInteractions: [
            { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Unary operations
    [InstrName.ABS, {
        name: InstrName.ABS,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM },
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],
    [InstrName.SQRT, {
        name: InstrName.SQRT,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Vector operations - return scalar
    [InstrName.DOT, {
        name: InstrName.DOT,
        validTypeInteractions: [
            { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.NUM },
            { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.NUM }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],
    [InstrName.MAGNITUDE, {
        name: InstrName.MAGNITUDE,
        validTypeInteractions: [
            { input_types: [DataType.VEC2], return_type: DataType.NUM },
            { input_types: [DataType.VEC3], return_type: DataType.NUM }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Cross product - vec3 only
    [InstrName.CROSS, {
        name: InstrName.CROSS,
        validTypeInteractions: [
            { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
        ],
        broadcast_type: BroadcastType.ELEMENTS
    }],

    // Reduction operations
    [InstrName.MIN, {
        name: InstrName.MIN,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM },
        ],
        broadcast_type: BroadcastType.REDUCE
    }],
    [InstrName.MAX, {
        name: InstrName.MAX,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM },
        ],
        broadcast_type: BroadcastType.REDUCE
    }],
    // total is the only one of these that can work on vectors why ?
    [InstrName.TOTAL, {
        name: InstrName.TOTAL,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM },
            { input_types: [DataType.VEC2], return_type: DataType.VEC2 },
            { input_types: [DataType.VEC3], return_type: DataType.VEC3 }
        ],
        broadcast_type: BroadcastType.REDUCE
    }],
    [InstrName.COUNT, {
        name: InstrName.COUNT,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: DataType.NUM },
            { input_types: [DataType.VEC2], return_type: DataType.NUM },
            { input_types: [DataType.VEC3], return_type: DataType.NUM }
        ],
        broadcast_type: BroadcastType.REDUCE
    }],

    // Control flow
    [InstrName.CALL, {
        name: InstrName.CALL,
        validTypeInteractions: [
            { input_types: [DataType.NUM], return_type: null }
        ],
        broadcast_type: BroadcastType.NONE
    }],
    [InstrName.RET, {
        name: InstrName.RET,
        validTypeInteractions: [
            { input_types: [], return_type: null }
        ],
        broadcast_type: BroadcastType.NONE
    }]
]);

enum VariantShape {
    SCALAR,
    VECTOR
}

enum OperandType {
    LITERAL,
    VARIABLE,
    FUCNTION_NAME
}

interface Operand {
    type: OperandType;
}

interface LiteralSingleOperand<T> extends Operand {
    data_type: DataType;
    value: singletDataVar<T>;
}

interface LiteralListOperand<T> extends Operand {
    data_type: DataType;
    values: dataListVar<T>;
}

interface VariableOperand extends Operand {
    name: string;
    data_type: DataType;
}

interface FunctionNameOperand extends Operand {
    name: string;
}

interface InstructionInstance {
    name: InstrName;

    variant_shape: VariantShape;
    variant_types: TypeInteraction;

    operands: Operand[];

    dest_var: VariableOperand | null;
}

interface DasmFunction {
    name: string;
    return_type: DataType;
    arg_types: Map<string, DataType>;
    local_vars: Map<string, DataType>;

    instructions: InstructionInstance[];
}

function sliceParens(str: string): string | null {
    const start = str.indexOf("(");
    const end = str.lastIndexOf(")");

    if (start === -1 || end === -1 || start >= end) {
        return null;
    }

    return str.substring(start + 1, end);
}

// the dasm runtime and compiler
class dasm_runtime {

    public compiler_options = {
        // dump data values into stdout once read
        showDataVals: false
    };

    public input_text: string = "default input";

    public dasm_code: string = "default dasm";
    public wat_code: string = "default wat";

    public stdout: string = "";
    private latest_compile_start_time: Date;

    public data_singlets: Map<string, singletDataVar<any>> = new Map();
    public data_lists: Map<string, dataListVar<any>> = new Map();

    reset_compiler_state() {
        this.dasm_code = "";
        this.wat_code = "";
        this.data_singlets.clear();
        this.data_lists.clear();
    }

    print_data_vars() {
        this.cout("Data Singlet Variables:<br>");
        this.data_singlets.forEach((value, key) => {
            this.cout(" - " + key + " = " + JSON.stringify(value.value) + "<br>");
        });
        this.cout("Data List Variables:<br>");
        this.data_lists.forEach((value, key) => {
            this.cout(" - " + key + " = " + JSON.stringify(value.values) + "<br>");
        });
    }

    get_dasm(): string {
        return this.dasm_code;
    }

    get_wat(): string {
        return this.wat_code;
    }

    get_stdout(): string {
        return this.stdout;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/&lt;br&gt;/g, '<br>');
    }

    cerr(msg: string) {
        this.stdout += "<span class='con-err'>" + this.escapeHtml(msg) + "</span><br>";
    }

    cwarn(msg: string) {
        this.stdout += "<span class='con-warn'>" + this.escapeHtml(msg) + "</span><br>";
    }

    cinfo(msg: string) {
        this.stdout += "<span class='con-info'>" + this.escapeHtml(msg) + "</span><br>";
    }

    cout(msg: string) {
        this.stdout += this.escapeHtml(msg);
    }

    compile_failed(err: string): never {
        this.cerr(err);
        this.cinfo("Failed to compile in " + (new Date().getTime() - this.latest_compile_start_time.getTime()) + " ms");
        throw new Error(err);
    }

    constructor() {
        // get supported wasm extensions
        if (simd()) {
            this.cinfo("SIMD in wasm is supported");
        } else {
            this.cerr("SIMD in wasm is NOT supported! Check your browser.");
        }

        if (relaxedSimd()) {
            this.cinfo("Relaxed SIMD in wasm is supported");
        } else {
            this.cinfo("Relaxed SIMD in wasm is NOT supported! Some things will not be available.");
        }
    }

    compile(input: string) {
        this.reset_compiler_state();
        this.latest_compile_start_time = new Date();
        this.input_text = input;

        this.cinfo("<br>Started compiling at " + this.latest_compile_start_time.toLocaleTimeString());

        var current_section: SectionType = SectionType.NONE;

        // loop over every line
        const lines = input.split("\n");

        // if first line starts with # thats means compiler options (not a code line)
        if (lines.length > 0 && lines[0].startsWith("#")) {
            const options_list = lines[0].slice(1).trim().toLocaleLowerCase().split(" ");

            if (options_list.includes("dd") || options_list.includes("dumpdata")) this.compiler_options.showDataVals = true;

            lines.shift();
        }

        var line_number = -1;
        for (let line of lines) {
            line_number += 1;

            line = line.trim();

            if (line.length == 0) continue;
            if (line.startsWith("//")) continue;

            switch (current_section) {
                case SectionType.NONE:
                    if (!line.startsWith("@")) {
                        continue;
                    }

                    if (!line.toLocaleLowerCase().startsWith("@data")) {
                        this.compile_failed("Unknown section: '" + line + "' at line " + line_number + ", must begin with data section");
                    } else {
                        // we are in data section
                        current_section = SectionType.DATA;
                        continue;
                    }

                    break;

                case SectionType.DATA:
                    // Data should only contain variable declarations
                    if (!line.startsWith("@")) {
                        this.parseDataVar(line, line_number);
                    } else {
                        // next should be the functions section
                        if (!line.toLocaleLowerCase().startsWith("@functions")) {
                            this.compile_failed("Unknown section: '" + line + "' at line " + line_number + ", expected functions section");
                        } else {
                            current_section = SectionType.FUNCTIONS;
                            if (this.compiler_options.showDataVals) this.print_data_vars();
                            continue;
                        }
                    }

                    break;

                case SectionType.FUNCTIONS:
                    // function declarations follow the format:
                    // fn <return type> <function name>(<arg type> <arg name>, ...) {
                    if (!line.startsWith("fn")) {
                        this.compile_failed("Expected function declaration at line " + line_number + ", got: '" + line + "'");
                    } else {
                        this.parseFunctionDecl(line, line_number);
                    }

                    break;

            }
        }

        this.cinfo("Finished compiling in " + (new Date().getTime() - this.latest_compile_start_time.getTime()) + " ms");
    }

    parseFunctionDecl(line: string, line_num: number) {
        const tokens = line.split(" ");

        // Declarations should be at least fn <return type> <function name>(<args>?)
        if (tokens.length < 3) this.compile_failed("Incomplete function declaration: '" + line + "' at line " + line_num);

        const return_type = tokens[1];
        // merge all tokens after fn and the return type
        const name_and_args = tokens.slice(2).join(" ");
    }

    parseDataVar(line: string, line_num: number) {
        const tokens = line.split(" ");
        // Declarations should be at least <data type> <name> = <value>
        if (tokens.length < 4) this.compile_failed("Incomplete variable declaration: '" + line + "' at line " + line_num);

        // vars cannot be declared with template specifiers
        if (tokens[0] == TemplateSpecifier.ANY || tokens[0] == TemplateSpecifier.VECN) this.compile_failed("Cannot declare data variable using a template specifier '" + line + "' at line " + line_num);

        // if the type ends with [], it's a list variable
        if (tokens[0].endsWith("[]")) {
            this.parseDataListVar(tokens, line_num);
        } else {
            this.parseDataSingletVar(tokens, line_num);
        }

        // eventually you will also be able to load from a datafile for big lists
    }
    parseDataSingletVar(tokens: string[], line_num: number) {
        const merged_tokens = tokens.slice(3).join("");
        const var_name = tokens[1];
        if (this.data_lists.has(var_name)) this.compile_failed("Variable redifinition: '" + var_name + "' at line " + line_num);

        switch (tokens[0]) {
            case DataType.NUM:
                const value = this.parseNumLiteral(merged_tokens.replace(/\s/g, ''), line_num);
                this.data_singlets.set(var_name, { name: var_name, value: value });
                break;

            // for vec3 and vec3 we have to join all tokens after the equal sign in case there are spaces
            case DataType.VEC2:
                const value2 = this.parseVec2Literal(merged_tokens.replace(/\s/g, ''), line_num);
                this.data_singlets.set(var_name, { name: var_name, value: value2 });
                break;

            case DataType.VEC3:
                const value3 = this.parseVec3Literal(merged_tokens.replace(/\s/g, ''), line_num);
                this.data_singlets.set(var_name, { name: var_name, value: value3 });
                break;

            default:
                this.compile_failed("Unknown data type: '" + tokens[0] + "' at line " + line_num);
        }
    }
    parseDataListVar(tokens: string[], line_num: number) {
        const merged_tokens = tokens.slice(3).join("");
        const values_str = merged_tokens.replace(/\s/g, ''); // remove all whitespace
        const var_name = tokens[1];

        if (this.data_lists.has(var_name)) this.compile_failed("Variable redifinition: '" + var_name + "' at line " + line_num);

        // remove the [] from the type
        const base_type = tokens[0].slice(0, -2);
        switch (base_type) {
            case DataType.NUM:
                
                const value_tokens_num = values_str.split(",");
                const values: dataNum[] = [];
                for (let vt of value_tokens_num) {
                    const val = this.parseNumLiteral(vt, line_num);
                    values.push(val);
                }

                this.data_lists.set(var_name, { name: var_name, values: values });
                break;

            case DataType.VEC2:
                // this one is a bit trickier since vec2 literals have commas inside them
                const value_tokens_vec2 = values_str.slice(2, -2).split("),(").map(s => `(${s})`); // remove the square brackets, split by "),(", and then add back the parentheses
                const values2: dataVec2[] = [];
                for (let vt of value_tokens_vec2) {
                    const val = this.parseVec2Literal(vt, line_num);
                    values2.push(val);
                }

                this.data_lists.set(var_name, { name: var_name, values: values2 });
                break;

            case DataType.VEC3:
                const value_tokens_vec3 = values_str.slice(2, -2).split("),(").map(s => `(${s})`);
                const values3: dataVec3[] = [];
                for (let vt of value_tokens_vec3) {
                    const val = this.parseVec3Literal(vt, line_num);
                    values3.push(val);
                }

                this.data_lists.set(var_name, { name: var_name, values: values3 });
                break;

            default:
                this.compile_failed("Unknown data type: '" + base_type + "' at line " + line_num);
        }
    }

    // Should be in the format of [0-9]*\.?[0-9]*
    parseNumLiteral(token: string, line_num: number): dataNum {
        const value = Number(token);
        if (isNaN(value)) this.compile_failed("Error parsing num literal: '" + token + "' at line " + line_num);
        return { value: value };
    }
    // should be in the format of (num,num)
    parseVec2Literal(token: string, line_num: number): dataVec2 {
        if (!token.startsWith("(") || !token.endsWith(")")) this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);

        const content = token.slice(1, -1);
        const parts = content.split(",");
        if (parts.length != 2) this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);

        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (isNaN(x) || isNaN(y)) this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);

        return { value: [x, y] };
    }
    // should be in the format of (num,num,num)
    parseVec3Literal(token: string, line_num: number): dataVec3 {
        if (!token.startsWith("(") || !token.endsWith(")")) this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);

        const content = token.slice(1, -1);
        const parts = content.split(",");
        if (parts.length != 3) this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);

        const x = Number(parts[0]);
        const y = Number(parts[1]);
        const z = Number(parts[2]);
        if (isNaN(x) || isNaN(y) || isNaN(z)) this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);

        return { value: [x, y, z] };
    }
}

export { dasm_runtime };