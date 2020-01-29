import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';

const dev = process.env.ROLLUP_WATCH;

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
  dev && serve({
    contentBase: 'dist',
    host: '0.0.0.0',
    port: 5000,
    allowCrossOrigin: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }),
  !dev && terser(),
];

export default {
  input: 'src/card.ts',
  output: {
    file: 'dist/sun-card.js',
    format: 'es',
  },
  plugins: [...commonPlugins],
};
