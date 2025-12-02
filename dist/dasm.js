// @ts-ignore
import { simd, relaxedSimd } from "https://unpkg.com/wasm-feature-detect@1.8.0/dist/esm/index.js";
var SectionType;
(function (SectionType) {
    SectionType[SectionType["NONE"] = 0] = "NONE";
    SectionType[SectionType["DATA"] = 1] = "DATA";
    SectionType[SectionType["FUNCTIONS"] = 2] = "FUNCTIONS";
    SectionType[SectionType["PROGRAM"] = 3] = "PROGRAM";
})(SectionType || (SectionType = {}));
var DataType;
(function (DataType) {
    DataType["NUM"] = "num";
    DataType["VEC2"] = "vec2";
    DataType["VEC3"] = "vec3";
})(DataType || (DataType = {}));
var TemplateSpecifier;
(function (TemplateSpecifier) {
    TemplateSpecifier["ANY"] = "any";
    TemplateSpecifier["VECN"] = "vecn";
})(TemplateSpecifier || (TemplateSpecifier = {}));
var BinaryOp;
(function (BinaryOp) {
    BinaryOp["ADD"] = "+";
    BinaryOp["SUB"] = "-";
    BinaryOp["MUL"] = "*";
    BinaryOp["DIV"] = "/";
})(BinaryOp || (BinaryOp = {}));
var DasmInstrNames;
(function (DasmInstrNames) {
    // arithmetic
    DasmInstrNames["ADD"] = "add";
    DasmInstrNames["SUB"] = "sub";
    DasmInstrNames["MUL"] = "mul";
    DasmInstrNames["DIV"] = "div";
    DasmInstrNames["POW"] = "pow";
    DasmInstrNames["ABS"] = "abs";
    DasmInstrNames["SQRT"] = "sqrt";
    DasmInstrNames["DOT"] = "dot";
    DasmInstrNames["CROSS"] = "cross";
    DasmInstrNames["MAGNITUDE"] = "magnitude";
    DasmInstrNames["CALL"] = "call";
    DasmInstrNames["RET"] = "ret";
    DasmInstrNames["MIN"] = "min";
    DasmInstrNames["MAX"] = "max";
    DasmInstrNames["TOTAL"] = "total";
    DasmInstrNames["COUNT"] = "count";
})(DasmInstrNames || (DasmInstrNames = {}));
// How does this instruction interact with vectors. Note that is NOT the vec2/vec3 data type, but the lists.
var BroadcastType;
(function (BroadcastType) {
    BroadcastType[BroadcastType["ELEMENTS"] = 0] = "ELEMENTS";
    BroadcastType[BroadcastType["NONE"] = 1] = "NONE";
    BroadcastType[BroadcastType["REDUCE"] = 2] = "REDUCE"; // reduce a vector to a scalar, things like total, min, max etc
})(BroadcastType || (BroadcastType = {}));
const INSTRUCTION_REGISTRY = new Map([
    // Binary arithmetic - same types only
    [DasmInstrNames.ADD, {
            name: DasmInstrNames.ADD,
            typeInteractions: [
                { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
                { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.VEC2 },
                { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    [DasmInstrNames.SUB, {
            name: DasmInstrNames.SUB,
            typeInteractions: [
                { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
                { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.VEC2 },
                { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    [DasmInstrNames.DIV, {
            name: DasmInstrNames.DIV,
            typeInteractions: [
                { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Multiplication - supports scalar broadcasting
    [DasmInstrNames.MUL, {
            name: DasmInstrNames.MUL,
            typeInteractions: [
                { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM },
                // Scalar multiplication
                { input_types: [DataType.NUM, DataType.VEC2], return_type: DataType.VEC2 },
                { input_types: [DataType.NUM, DataType.VEC3], return_type: DataType.VEC3 }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Power
    [DasmInstrNames.POW, {
            name: DasmInstrNames.POW,
            typeInteractions: [
                { input_types: [DataType.NUM, DataType.NUM], return_type: DataType.NUM }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Unary operations
    [DasmInstrNames.ABS, {
            name: DasmInstrNames.ABS,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM },
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    [DasmInstrNames.SQRT, {
            name: DasmInstrNames.SQRT,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Vector operations - return scalar
    [DasmInstrNames.DOT, {
            name: DasmInstrNames.DOT,
            typeInteractions: [
                { input_types: [DataType.VEC2, DataType.VEC2], return_type: DataType.NUM },
                { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.NUM }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    [DasmInstrNames.MAGNITUDE, {
            name: DasmInstrNames.MAGNITUDE,
            typeInteractions: [
                { input_types: [DataType.VEC2], return_type: DataType.NUM },
                { input_types: [DataType.VEC3], return_type: DataType.NUM }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Cross product - vec3 only
    [DasmInstrNames.CROSS, {
            name: DasmInstrNames.CROSS,
            typeInteractions: [
                { input_types: [DataType.VEC3, DataType.VEC3], return_type: DataType.VEC3 }
            ],
            broadcast_type: BroadcastType.ELEMENTS
        }],
    // Reduction operations
    [DasmInstrNames.MIN, {
            name: DasmInstrNames.MIN,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM },
            ],
            broadcast_type: BroadcastType.REDUCE
        }],
    [DasmInstrNames.MAX, {
            name: DasmInstrNames.MAX,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM },
            ],
            broadcast_type: BroadcastType.REDUCE
        }],
    // total is the only one of these that can work on vectors why ?
    [DasmInstrNames.TOTAL, {
            name: DasmInstrNames.TOTAL,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM },
                { input_types: [DataType.VEC2], return_type: DataType.VEC2 },
                { input_types: [DataType.VEC3], return_type: DataType.VEC3 }
            ],
            broadcast_type: BroadcastType.REDUCE
        }],
    [DasmInstrNames.COUNT, {
            name: DasmInstrNames.COUNT,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: DataType.NUM },
                { input_types: [DataType.VEC2], return_type: DataType.NUM },
                { input_types: [DataType.VEC3], return_type: DataType.NUM }
            ],
            broadcast_type: BroadcastType.REDUCE
        }],
    // Control flow
    [DasmInstrNames.CALL, {
            name: DasmInstrNames.CALL,
            typeInteractions: [
                { input_types: [DataType.NUM], return_type: null }
            ],
            broadcast_type: BroadcastType.NONE
        }],
    [DasmInstrNames.RET, {
            name: DasmInstrNames.RET,
            typeInteractions: [
                { input_types: [], return_type: null }
            ],
            broadcast_type: BroadcastType.NONE
        }]
]);
// the dasm runtime and compiler
class dasm_runtime {
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
    get_dasm() {
        return this.dasm_code;
    }
    get_wat() {
        return this.wat_code;
    }
    get_stdout() {
        return this.stdout;
    }
    cerr(msg) {
        this.stdout += "<span class='con-err'>" + msg + "</span><br>";
    }
    cwarn(msg) {
        this.stdout += "<span class='con-warn'>" + msg + "</span><br>";
    }
    cinfo(msg) {
        this.stdout += "<span class='con-info'>" + msg + "</span><br>";
    }
    cout(msg) {
        this.stdout += msg;
    }
    compile_failed(err) {
        this.cerr(err);
        this.cinfo("Failed to compile in " + (new Date().getTime() - this.latest_compile_start_time.getTime()) + " ms");
        throw new Error(err);
    }
    constructor() {
        this.compiler_options = {
            // dump data values into stdout once read
            showDataVals: false
        };
        this.input_text = "default input";
        this.dasm_code = "default dasm";
        this.wat_code = "default wat";
        this.stdout = "";
        this.data_singlets = new Map();
        this.data_lists = new Map();
        // get supported wasm extensions
        if (simd()) {
            this.cinfo("SIMD in wasm is supported");
        }
        else {
            this.cerr("SIMD in wasm is NOT supported! Check your browser.");
        }
        if (relaxedSimd()) {
            this.cinfo("Relaxed SIMD in wasm is supported");
        }
        else {
            this.cinfo("Relaxed SIMD in wasm is NOT supported! Some things will not be available.");
        }
    }
    compile(input) {
        this.reset_compiler_state();
        this.latest_compile_start_time = new Date();
        this.input_text = input;
        this.cinfo("<br>Started compiling at " + this.latest_compile_start_time.toLocaleTimeString());
        var current_section = SectionType.NONE;
        // loop over every line
        const lines = input.split("\n");
        // if first line starts with # thats means compiler options (not a code line)
        if (lines.length > 0 && lines[0].startsWith("#")) {
            const options_list = lines[0].slice(1).trim().toLocaleLowerCase().split(" ");
            if (options_list.includes("dd") || options_list.includes("dumpdata"))
                this.compiler_options.showDataVals = true;
            lines.shift();
        }
        var line_number = -1;
        for (let line of lines) {
            line_number += 1;
            line = line.trim();
            if (line.length == 0)
                continue;
            if (line.startsWith("//"))
                continue;
            switch (current_section) {
                case SectionType.NONE:
                    if (!line.startsWith("@")) {
                        continue;
                    }
                    if (!line.toLocaleLowerCase().startsWith("@data")) {
                        this.compile_failed("Unknown section: '" + line + "' at line " + line_number + ", must begin with data section");
                    }
                    else {
                        // we are in data section
                        current_section = SectionType.DATA;
                        continue;
                    }
                case SectionType.DATA:
                    // Data should only contain variable declarations
                    if (!line.startsWith("@")) {
                        this.parseDataVar(line, line_number);
                    }
                    else {
                        // next should be the functions section
                        if (!line.toLocaleLowerCase().startsWith("@functions")) {
                            this.compile_failed("Unknown section: '" + line + "' at line " + line_number + ", expected functions section");
                        }
                        else {
                            current_section = SectionType.FUNCTIONS;
                            if (this.compiler_options.showDataVals)
                                this.print_data_vars();
                            continue;
                        }
                    }
            }
        }
        this.cinfo("Finished compiling in " + (new Date().getTime() - this.latest_compile_start_time.getTime()) + " ms");
    }
    parseDataVar(line, line_num) {
        const tokens = line.split(" ");
        // Declarations should be at least <data type> <name> = <value>
        if (tokens.length < 4)
            this.compile_failed("Incomplete variable declaration: '" + line + "' at line " + line_num);
        // vars cannot be declared with template specifiers
        if (tokens[0] == TemplateSpecifier.ANY || tokens[0] == TemplateSpecifier.VECN)
            this.compile_failed("Cannot declare data variable using a template specifier '" + line + "' at line " + line_num);
        // if the type ends with [], it's a list variable
        if (tokens[0].endsWith("[]")) {
            this.parseDataListVar(tokens, line_num);
        }
        else {
            this.parseDataSingletVar(tokens, line_num);
        }
        // eventually you will also be able to load from a datafile for big lists
    }
    parseDataSingletVar(tokens, line_num) {
        const merged_tokens = tokens.slice(3).join("");
        const var_name = tokens[1];
        if (this.data_lists.has(var_name))
            this.compile_failed("Variable redifinition: '" + var_name + "' at line " + line_num);
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
    parseDataListVar(tokens, line_num) {
        const merged_tokens = tokens.slice(3).join("");
        const values_str = merged_tokens.replace(/\s/g, ''); // remove all whitespace
        const var_name = tokens[1];
        if (this.data_lists.has(var_name))
            this.compile_failed("Variable redifinition: '" + var_name + "' at line " + line_num);
        // remove the [] from the type
        const base_type = tokens[0].slice(0, -2);
        switch (base_type) {
            case DataType.NUM:
                const value_tokens_num = values_str.split(",");
                const values = [];
                for (let vt of value_tokens_num) {
                    const val = this.parseNumLiteral(vt, line_num);
                    values.push(val);
                }
                this.data_lists.set(var_name, { name: var_name, values: values });
                break;
            case DataType.VEC2:
                // this one is a bit trickier since vec2 literals have commas inside them
                const value_tokens_vec2 = values_str.slice(2, -2).split("),(").map(s => `(${s})`); // remove the square brackets, split by "),(", and then add back the parentheses
                const values2 = [];
                for (let vt of value_tokens_vec2) {
                    const val = this.parseVec2Literal(vt, line_num);
                    values2.push(val);
                }
                this.data_lists.set(var_name, { name: var_name, values: values2 });
                break;
            case DataType.VEC3:
                const value_tokens_vec3 = values_str.slice(2, -2).split("),(").map(s => `(${s})`);
                const values3 = [];
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
    parseNumLiteral(token, line_num) {
        const value = Number(token);
        if (isNaN(value))
            this.compile_failed("Error parsing num literal: '" + token + "' at line " + line_num);
        return { value: value };
    }
    // should be in the format of (num,num)
    parseVec2Literal(token, line_num) {
        if (!token.startsWith("(") || !token.endsWith(")"))
            this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);
        const content = token.slice(1, -1);
        const parts = content.split(",");
        if (parts.length != 2)
            this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (isNaN(x) || isNaN(y))
            this.compile_failed("Error parsing vec2 literal: '" + token + "' at line " + line_num);
        return { value: [x, y] };
    }
    // should be in the format of (num,num,num)
    parseVec3Literal(token, line_num) {
        if (!token.startsWith("(") || !token.endsWith(")"))
            this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);
        const content = token.slice(1, -1);
        const parts = content.split(",");
        if (parts.length != 3)
            this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        const z = Number(parts[2]);
        if (isNaN(x) || isNaN(y) || isNaN(z))
            this.compile_failed("Error parsing vec3 literal: '" + token + "' at line " + line_num);
        return { value: [x, y, z] };
    }
}
export { dasm_runtime };
