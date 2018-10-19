
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
// import uglify from 'rollup-plugin-uglify-es';

export default {
    input: 'src/es6/index.js',
    name: 'PostalWorker',
    output: {
        file: 'dist/PostalWorker.min.js',
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
        babel(babelrc())
        //uglify()
    ]
};
