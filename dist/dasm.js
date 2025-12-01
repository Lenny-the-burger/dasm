// @ts-ignore
import { simd, relaxedSimd } from "../node_modules/wasm-feature-detect/dist/esm/index.js";
var SectionType;
(function (SectionType) {
    SectionType[SectionType["DATA"] = 0] = "DATA";
    SectionType[SectionType["FUCNTIONS"] = 1] = "FUCNTIONS";
    SectionType[SectionType["PROGRAM"] = 2] = "PROGRAM";
})(SectionType || (SectionType = {}));
const data_types = ["num", "vec2", "vec3", "vecn", "any"];
// the dasm runtime and compiler
class dasm_runtime {
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
    constructor() {
        this.input_text = "default input";
        this.dasm_code = "default dasm";
        this.wat_code = "default wat";
        this.stdout = "";
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
        this.input_text = input;
        this.cinfo("<br>Started compiling at " + new Date().toLocaleTimeString());
        var current_section = SectionType.DATA;
        // loop over every line
        const lines = input.split("\n");
        var line_number = -1;
        for (let line of lines) {
            line_number += 1;
            line = line.trim();
            if (line.length == 0)
                continue;
            if (line.startsWith("//"))
                continue;
            // await section
            if (!line.startsWith("@")) {
                continue;
            }
            switch (current_section) {
                case SectionType.DATA:
                    if (!line.toLocaleLowerCase().startsWith("@data")) {
                        this.cerr("Unknown section: " + line + " at line " + line_number + ", must begin with data section");
                        return;
                    }
                    else {
                        // we are in the data section
                        continue;
                    }
                    var words = line.split(" ");
            }
        }
    }
}
export { dasm_runtime };
