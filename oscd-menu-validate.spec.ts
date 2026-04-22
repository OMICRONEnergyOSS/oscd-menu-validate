/* eslint-disable import/no-extraneous-dependencies */
import { fixture, html } from '@open-wc/testing';

import OscdMenuValidate from './oscd-menu-validate.js';

if (customElements.get('oscd-menu-validate') === undefined)
  customElements.define('oscd-menu-validate', OscdMenuValidate);

describe('oscd-menu-validate', () => {
  let editor: OscdMenuValidate;
  beforeEach(async () => {
    editor = await fixture(html`<oscd-menu-validate></oscd-menu-validate>`);

    document.body.prepend(editor);
  });

  afterEach(async () => {
    editor.remove();
  });

  it('dummy test', async () => {});
});
