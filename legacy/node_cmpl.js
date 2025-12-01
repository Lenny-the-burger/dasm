// This is just for compiling with node.js

import { go_compile } from './dasm_compiler.mjs';
import fs from 'fs';

const smdCode = `// Simple Example
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

triangle(myfunc(points));
`;

const dasmCode = go_compile(smdCode);

// Write output to file
fs.writeFileSync('output/output.dasm', JSON.stringify(dasmCode, null, 2));

// for now its actually just the ast

console.log('DASM code written to output/output.dasm');