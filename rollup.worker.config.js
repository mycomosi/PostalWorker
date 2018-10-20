

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify-es';

export default {
    input: 'src/es6/SharedWorker.js',
    name: 'Worker',
    output: {
        file: 'dist/PostalSharedWorker.js',
        // file: '../entourage/demo/lib/PostalSharedWorker.js',
        format: 'iife',
        sourcemap: false,
        onwarn: (message) => {
            if (/Use of eval/.test(message)) return;
            console.error(message);
        }
    },
    plugins: [
        resolve({
            jsnext: true,
            main: true,
            browser: true,
        }),
        commonjs(),
        uglify()
    ]
};
