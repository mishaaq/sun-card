import resolve from 'rollup-plugin-node-resolve';
import typescript  from 'rollup-plugin-typescript2';


const commonPlugins = [
    resolve(),
    typescript()
];

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'sun-card.js',
            format: 'es'
        },
        plugins: [...commonPlugins]
    },
    {
        input: 'src/editor.ts',
        output: {
            file: 'sun-card-editor.js',
            format: 'es'
        },
        plugins: [...commonPlugins]
    }
]