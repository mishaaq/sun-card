import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const commonPlugins = [
  resolve(),
  commonjs({
    include: [
      'node_modules/moment/**',
      'node_modules/moment-timezone/**',
    ],
    sourceMap: false,
  }),
  typescript(),
  json({
    include: [
      'node_modules/moment-timezone/**',
    ],
    compact: true,
    preferConst: true,
  }),
  terser(),
];

export default {
  input: 'src/card.ts',
  output: {
    file: 'sun-card.js',
    format: 'es',
  },
  plugins: [...commonPlugins],
};
