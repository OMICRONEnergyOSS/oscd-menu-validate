/* eslint-disable import/no-extraneous-dependencies */
import { validate } from '@openenergytools/xml-schema-validator';
import type { Issue } from '@openenergytools/xml-schema-validator';
import { getSchema, getSchemaKey } from './schemas.js';

export async function validateSchema(
  doc: XMLDocument,
  docName: string
): Promise<Issue[]> {
  const [version, revision, release] = [
    doc.documentElement.getAttribute('version') ?? '',
    doc.documentElement.getAttribute('revision') ?? '',
    doc.documentElement.getAttribute('release') ?? '',
  ];

  if (typeof Worker === 'undefined') {
    return [
      {
        title: 'Schema validation unavailable in this environment',
        message: 'Web Worker API is not available.',
      },
    ];
  }

  const schemaKey = getSchemaKey(version, revision, release);
  if (!schemaKey) {
    return [
      {
        title: 'Unsupported SCL schema version',
        message: `No bundled XSD for version='${version}', revision='${revision}', release='${release}'.`,
      },
    ];
  }

  const docContent = new XMLSerializer().serializeToString(doc);
  const schema = getSchema(version, revision, release);
  if (!schema) {
    return [
      {
        title: 'Schema lookup failed',
        message: `Could not resolve bundled XSD content for '${schemaKey}'.`,
      },
    ];
  }

  const schemaName = `SCL${schemaKey}.xsd`;

  try {
    const result = await validate(
      { content: docContent, name: docName },
      { content: schema, name: schemaName }
    );

    if (result === null) {
      return [
        {
          title: 'Schema validator worker failed to initialize',
          message:
            'The validator returned no result. Ensure xml-schema-validator worker and wasm assets are served correctly.',
        },
      ];
    }

    return result;
  } catch (error) {
    return [
      {
        title: 'Schema validation threw an exception',
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
}
