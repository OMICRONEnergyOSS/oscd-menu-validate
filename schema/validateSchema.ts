/* eslint-disable import/no-extraneous-dependencies */
import type { Issue } from '@openenergytools/xml-schema-validator';
import { getSchema, getSchemaKey } from './schemas.js';

// ---------------------------------------------------------------------------
// Worker message type guards
// ---------------------------------------------------------------------------

interface ValidationResult {
  file: string;
  valid: boolean;
}

interface ValidationError {
  file: string;
  line: string;
  node: string;
  part: string;
  message: string;
}

interface LoadSchemaResult {
  file: string;
  loaded: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidationResult(msg: unknown): msg is ValidationResult {
  if (!isRecord(msg)) return false;
  return 'file' in msg && 'valid' in msg && !('loaded' in msg);
}

function isValidationError(msg: unknown): msg is ValidationError {
  if (!isRecord(msg)) return false;
  return 'file' in msg && !('valid' in msg) && !('loaded' in msg);
}

function isLoadSchemaResult(msg: unknown): msg is LoadSchemaResult {
  if (!isRecord(msg)) return false;
  return 'file' in msg && !('valid' in msg) && 'loaded' in msg;
}

// ---------------------------------------------------------------------------
// Blob Worker construction
// ---------------------------------------------------------------------------

/**
 * The upstream xml-schema-validator creates Workers via
 *   new Worker(new URL("./xmlvalidate/worker.js", import.meta.url))
 *
 * This fails when the plugin is loaded cross-origin (e.g. from GitHub Pages
 * into a Distro hosted locally or elsewhere) because the Worker constructor requires the
 * script URL to be same-origin with the *page*, not the module.
 *
 * A Blob Worker sidesteps this: the blob URL inherits the page's origin, and
 * importScripts() inside a Worker is not subject to same-origin restrictions.
 * locateFile is set so the Emscripten code can find xmlvalidate.wasm.
 */
function createSchemaWorker(): Worker {
  const moduleUrl = new URL(import.meta.url);
  moduleUrl.pathname = moduleUrl.pathname.replace(/[^/]*$/, 'xmlvalidate/');
  const xmlvalidateBase = moduleUrl.href;
  const xmlvalidateJsUrl = new URL('xmlvalidate.js', xmlvalidateBase).href;

  const source = `
    self.Module = {
      locateFile: function(path) {
        return new URL(path, ${JSON.stringify(xmlvalidateBase)}).href;
      }
    };
    importScripts(${JSON.stringify(xmlvalidateJsUrl)});
    self.onmessage = function(e) {
      Module.ready.then(function(mod) {
        if (String(e.data.name).toLowerCase().endsWith('.xsd'))
          mod.init(e.data.content, e.data.name);
        else
          mod.validate(e.data.content, e.data.name);
      });
    };
  `;

  const blob = new Blob([source], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return new Worker(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs} ms`)),
      timeoutMs
    );
    promise
      .then(v => {
        window.clearTimeout(timer);
        resolve(v);
      })
      .catch(e => {
        window.clearTimeout(timer);
        reject(e);
      });
  });
}

// ---------------------------------------------------------------------------
// Worker-based validate
// ---------------------------------------------------------------------------

async function validateWithWorker(
  xml: { content: string; name: string },
  xsd: { content: string; name: string }
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const worker = createSchemaWorker();
  const teardown = () => worker.terminate();

  try {
    // Phase 1 – load the XSD into the WASM validator
    const initPromise = new Promise<void>((resolve, reject) => {
      const onError = (event: ErrorEvent): void => {
        // eslint-disable-next-line no-use-before-define
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        reject(
          new Error(
            event.message || 'Schema worker failed while loading the schema.'
          )
        );
      };
      const onMessage = (event: MessageEvent<unknown>): void => {
        if (isLoadSchemaResult(event.data)) {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          if (event.data.loaded) resolve();
          else reject(new Error('Schema cannot be loaded'));
        }
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ content: xsd.content, name: xsd.name });
    });

    await withTimeout(initPromise, 15_000, 'Schema worker initialization');

    // Phase 2 – validate the XML against the loaded XSD
    const validatePromise = new Promise<Issue[]>((resolve, reject) => {
      const onError = (event: ErrorEvent): void => {
        // eslint-disable-next-line no-use-before-define
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        reject(
          new Error(
            event.message || 'Schema worker failed while validating XML.'
          )
        );
      };
      const onMessage = (event: MessageEvent<unknown>): void => {
        if (isValidationResult(event.data) && event.data.file === xml.name) {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          if (event.data.valid)
            issues.push({ title: 'Project is schema valid' });
          resolve(issues);
          return;
        }
        if (isValidationError(event.data)) {
          const parts = event.data.message.split(': ', 2);
          const description = parts[1] ? parts[1] : parts[0];
          const qualifiedTag = parts[1] ? ` (${parts[0]})` : '';
          issues.push({
            title: description,
            message: `${event.data.file}:${event.data.line} ${event.data.node} ${event.data.part}${qualifiedTag}`,
          });
        }
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ content: xml.content, name: xml.name });
    });

    return await withTimeout(validatePromise, 20_000, 'Schema validation');
  } finally {
    teardown();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
    return await validateWithWorker(
      { content: docContent, name: docName },
      { content: schema, name: schemaName }
    );
  } catch (error) {
    return [
      {
        title: 'Schema validation threw an exception',
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
}
