// @ts-ignore
import { simd, relaxedSimd } from "../node_modules/wasm-feature-detect/dist/esm/index.js";

enum SectionType {
    DATA,
    FUCNTIONS,
    PROGRAM
}

const data_types = ["num", "vec2", "vec3", "vecn", "any"];

// the dasm runtime and compiler
class dasm_runtime {

    public input_text: string = "default input";

    public dasm_code: string = "default dasm";
    public wat_code: string = "default wat";

    public stdout: string = "";

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
        this.input_text = input;

        this.cinfo("<br>Started compiling at " + new Date().toLocaleTimeString());

        var current_section: SectionType = SectionType.DATA;

        // loop over every line
        const lines = input.split("\n");
        var line_number = -1;
        for (let line of lines) {
            line_number += 1;

            line = line.trim();

            if (line.length == 0) continue;
            if (line.startsWith("//")) continue;

            // await section
            if (!line.startsWith("@")) {
                continue;
            }

            switch (current_section) {
                case SectionType.DATA:
                    if (!line.toLocaleLowerCase().startsWith("@data")) {
                        this.cerr("Unknown section: " + line + " at line " + line_number + ", must begin with data section");
                        return;
                    } else {
                        // we are in the data section
                        continue;
                    }

                    var words = line.split(" ");
            }
        }
    }
}

export { dasm_runtime };