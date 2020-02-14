import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import sizes from 'rollup-plugin-sizes';

const pkg = require('./package.json');

const dev = process.env.ROLLUP_WATCH;

const commonPlugins = [
  replace({
    __VERSION__: pkg.version,
  }),
  resolve(),
  commonjs({
    include: [
      'node_modules/moment/**',
      'node_modules/moment-timezone/**',
    ],
    sourceMap: false,
  }),
  typescript(),
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
  sizes(),
];

export default {
  input: 'src/card.ts',
  output: {
    file: 'dist/sun-card.js',
    format: 'es',
  },
  plugins: [...commonPlugins],
};
