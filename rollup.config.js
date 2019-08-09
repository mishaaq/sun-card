import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';


const commonPlugins = [
    json({
        include: [
            'node_modules/moment-timezone/**'
        ],
        compact: true,
        preferConst: true
    }),
    commonjs({
        include: [
            'node_modules/moment/**',
            'node_modules/moment-timezone/**',
            'node_modules/humanize-duration-ts/**'
        ],
        sourceMap: false
    }),
    resolve({
        mainFields: ['main']
    }),
    typescript()
];

export default {
    input: 'src/card.ts',
    output: {
        file: 'sun-card.js',
        format: 'esm',
        compact: true
    },
    plugins: [...commonPlugins]
}