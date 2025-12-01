// @ts-ignore
import { simd, relaxedSimd } from "../node_modules/wasm-feature-detect/dist/esm/index.js";

enum SectionType {
    NONE,
    DATA,
    FUCNTIONS,
    PROGRAM
}

enum DataType {
    NUM = "num",
    VEC2 = "vec2",
    VEC3 = "vec3",
    VECN = "vecn",
    ANY = "any"
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

    cerr(msg: string) {
        this.stdout += "<span class='con-err'>" + msg + "</span><br>";
    }

    cwarn(msg: string) {
        this.stdout += "<span class='con-warn'>" + msg + "</span><br>";
    }

    cinfo(msg: string) {
        this.stdout += "<span class='con-info'>" + msg + "</span><br>";
    }

    cout(msg: string) {
        this.stdout += msg;
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

                case SectionType.DATA:
                    // Data should only contain variable declarations
                    if (!line.startsWith("@")) {
                        this.parseDataVar(line, line_number);
                    } else {
                        // next should be the functions section
                        if (!line.toLocaleLowerCase().startsWith("@functions")) {
                            this.compile_failed("Unknown section: '" + line + "' at line " + line_number + ", expected functions section");
                        } else {
                            current_section = SectionType.FUCNTIONS;
                            if (this.compiler_options.showDataVals) this.print_data_vars();
                            continue;
                        }
                    }

            }
        }

        this.cinfo("Finished compiling in " + (new Date().getTime() - this.latest_compile_start_time.getTime()) + " ms");
    }

    parseDataVar(line: string, line_num: number) {
        const tokens = line.split(" ");
        // Declarations should be at least <data type> <name> = <value>
        if (tokens.length < 4) this.compile_failed("Incomplete variable declaration: '" + line + "' at line " + line_num);

        // any and vecn cannot be used for variables, only function parameters
        if (tokens[0] == DataType.ANY || tokens[0] == DataType.VECN) this.compile_failed("Invalid data type for variable declaration: '" + tokens[0] + "' at line " + line_num);

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