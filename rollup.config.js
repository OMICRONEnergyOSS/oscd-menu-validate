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
    importMetaAssets(),
    copy({
      targets: [
        // The blob worker loads these via importScripts() at runtime.
        // Only the JS glue + WASM binary are needed; worker.js is replaced
        // by the inline blob source in validateSchema.ts.
        {
          src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.js',
          dest: 'dist/xmlvalidate',
        },
        {
          src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.wasm',
          dest: 'dist/xmlvalidate',
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

      /** Bundle assets referenced via import.meta.url (.nsd files etc.) */
      importMetaAssets(),
      copy({
        targets: [
          { src: 'demo/sample.scd', dest: 'dist/demo' },
          { src: 'demo/*.js', dest: 'dist/demo' },
          // WASM validator files for the blob worker (loaded via importScripts)
          {
            src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.js',
            dest: 'dist/demo/xmlvalidate',
          },
          {
            src: 'node_modules/@openenergytools/xml-schema-validator/dist/xmlvalidate/xmlvalidate.wasm',
            dest: 'dist/demo/xmlvalidate',
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
