import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const isProd = process.env.BUILD === 'production';

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    format: 'cjs',
    name: 'CopyWithImages',
    sourcemap: !isProd,
    exports: 'default'
  },
  external: ['obsidian', 'electron'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs()
  ]
};