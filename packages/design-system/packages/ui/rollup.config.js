import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      exclude: ['**/*.test.tsx', '**/*.test.ts', '**/*.stories.tsx'],
    }),
    postcss({
      config: {
        path: './postcss.config.js',
      },
      extensions: ['.css'],
      minimize: true,
      inject: {
        insertAt: 'top',
      },
    }),
  ],
  external: [
    'react',
    'react-dom',
    '@strathon/tokens',
    'lucide-react',
    '@radix-ui/react-slot',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-switch',
    '@radix-ui/react-progress',
    '@radix-ui/react-separator',
  ],
};
