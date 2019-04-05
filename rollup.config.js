import resolve from 'rollup-plugin-node-resolve';
import typescript  from 'rollup-plugin-typescript2';


const commonPlugins = [
    resolve(),
    typescript()
];

export default {
    input: 'src/card.ts',
    output: {
        file: 'sun-card.js',
        format: 'es'
    },
    plugins: [...commonPlugins]
}