import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import copy from 'rollup-plugin-copy';

export default [{
  input: './oscd-menu-validate.ts',
  output: {
    sourcemap: true,        // Add source map to build output
    format:'es',            // ES module type export
    dir: 'dist',            // The build output folder
    // preserveModules: true,  // Keep directory structure and files
  },
  // preserveEntrySignatures: 'strict', // leaves export of the plugin entry point

  plugins: [
    nodeResolve(),
    typescript(),
    // Exclude xml-schema-validator.js from importMetaAssets so that the worker
    // URL ./xmlvalidate/worker.js is kept as-is in the bundle. The copy plugin
    // below deploys the full xmlvalidate/ directory alongside oscd-menu-validate.js,
    // which is required because worker.js uses importScripts('xmlvalidate.js') —
    // a relative path that resolves relative to the worker's own location.
    importMetaAssets({ exclude: ['**/xml-schema-validator.js'] }),
    copy({
      targets: [
        // Copy the complete xmlvalidate directory so worker.js, xmlvalidate.js
        // and xmlvalidate.wasm are all served from the same path.
        {
          src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate',
          dest: 'dist',
        },
        {
          src: 'node_modules/@openenergytools/scl-template-validator/dist/nsd',
          dest: 'dist/assets',
        },
      ],
      hook: 'writeBundle',
      verbose: true,
    }),
   ],
},  {
    input: 'demo/index.html',
    plugins: [
      html({
        input: 'demo/index.html',
        minify: true,
      }),
      /** Resolve bare module imports */
      nodeResolve(),

      /** Bundle assets references via import.meta.url — processes .nsd file
       *  references and copies worker.js (from dist/xmlvalidate/) to demo/assets/.
       *  xmlvalidate.js and xmlvalidate.wasm are copied alongside it by the copy
       *  plugin below so that worker.js can resolve importScripts('xmlvalidate.js').
       */
      importMetaAssets(),
      copy({
        targets: [
          { src: 'demo/sample.scd', dest: 'dist/demo' },
          { src: 'demo/*.js', dest: 'dist/demo' },
          // importMetaAssets places worker.js in dist/demo/assets/; copy the
          // Emscripten support files to the same directory so importScripts
          // can find them relative to the worker.
          {
            src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.js',
            dest: 'dist/demo/assets',
          },
          {
            src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.wasm',
            dest: 'dist/demo/assets',
          },
        ],
        verbose: true,
        flatten: true,
      }),
    ],
    output: {
      dir: 'dist/demo',
      format: 'es',
      sourcemap: true,
    },
  },];
