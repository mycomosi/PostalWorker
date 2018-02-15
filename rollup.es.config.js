

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
//import uglify from 'rollup-plugin-uglify-es';

export default {
    input: 'src/es6/main.js',
    name: 'PostalWorker',
    output: {
        file: 'dist/PostalWorker.es.js',
        format: 'es',
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
        commonjs()//,
        //uglify()
    ]
};