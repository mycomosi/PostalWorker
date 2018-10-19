// Rollup plugins
import eslint from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: './demos/IE11/demo-ie11.js',
    output: {
        file: 'dist/demo.demo-ie11.js',
        format: 'es',
        sourcemap: false
    },
    plugins: [
        resolve(),
        commonjs(),
        eslint()
    ]
};
