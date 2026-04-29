# \<oscd-menu-validate>

## What is this?

This is an editor plugin for [OpenSCD](https://openscd.org). Long term, this plugin will allow you to manage validation algorithms for SCL and see all issues found by the algorithms in a central place.

At this moment two type of validators are utilized by this plugin:

- XML Schema validator maintained in [XML schema validator](https://github.com/openenergytools/xml-schema-validator). The plugin is schema validating against either edition 1 (schema1.7), edition 2.1 (2007B4) and edition 2 (2007B)
- validation of the `DataTypeTemplates` section based on the namespace description files (NSD) published by IEC 61850 for the parts 7-2, 7-3. 7-4 and 8-1. The validator doing the bulk work is maintained here: [template validator](https://github.com/openenergytools/scl-template-validator)

## Using plugin in Distro

This plugin depends on the @openenergytools/xml-schema-validator for Schema Validation, which runs validation in a worker. In order to be able to successfully run this plugin in your distro, you need to extend your rollup config to copy the xmlvalidate resources the worker will attempt to load, into the expected folder in your bundle. So add this copy configuration to your plugins:

```javascript
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
```

## Future improvements

- Export issues to other formats such as PDF, CSV and others
- Add communication validator including a
  - check for unique MAC-Addresses, APPID, IP-Addresses etc.
  - check that GOOSE publisher and subscriber are connected and on the same subnetwork

## Run demo

To scan the project for linting and formatting errors, run

```bash
npm run start
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

To run a local development server that serves the basic demo located in `demo/index.html`

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

&copy; Jakob Vogelsang
