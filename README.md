# \<oscd-menu-validate>

## What is this?

This is an editor plugin for [open-scd-core](https://github.com/openscd/open-scd-core#readme), the new core editor engine for OpenSCD. On the long term this plugin will allow you to manage validation algorithms for SCL and see all issues found by the algorithms in a central place.

At this moment two type of validators are utilized by this plugin:

- XML Schema validator maintained in [XML schema validator](https://github.com/openenergytools/xml-schema-validator). The plugin is schema validating against either edition 1 (schema1.7), edition 2.1 (2007B4) and edition 2 (2007B)
- validation of the `DataTypeTemplates` section based on the namespace description files (NSD) published by IEC 61850 for the parts 7-2, 7-3. 7-4 and 8-1. The validator doing the bulk work is maintained here: [template validator](https://github.com/openenergytools/scl-template-validator)

## Future improvements

- Export issues to other formats such as PDF, CSV and others
- Add communication validator including a
  - check for unique MAC-Addresses, APPID, IP-Addresses etc.
  - check that GOOSE publisher and subscriber are connected and on the same subnetwork

## How it looks like

![Invalid-Ed21](https://github.com/JakobVogelsang/openscd-plugins/assets/66802940/a2a0f2e9-9bde-4758-956d-915811021fe1)

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

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

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`

&copy; Jakob Vogelsang
