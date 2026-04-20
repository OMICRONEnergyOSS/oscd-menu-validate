/* eslint-disable import/no-extraneous-dependencies */
import { fixture, html } from '@open-wc/testing';

import { setViewport } from '@web/test-runner-commands';

import { visualDiff } from '@web/test-runner-visual-regression';

import {
  invalid2003doc,
  valid2003doc,
  templateIssuesDoc,
} from './oscd-menu-validate.testfiles.js';

import OscdMenuValidate from './oscd-menu-validate.js';

const factor = window.process && process.env.CI ? 4 : 2;
function timeout(ms: number) {
  return new Promise(res => {
    setTimeout(res, ms * factor);
  });
}
mocha.timeout(2000 * factor);

setViewport({ width: 600, height: 800 });

describe('Validating menu plugin', () => {
  if (customElements.get('oscd-menu-validate') === undefined)
    customElements.define('oscd-menu-validate', OscdMenuValidate);

  let div: HTMLElement;
  beforeEach(() => {
    div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';

    document.body.prepend(div);
  });

  afterEach(async () => {
    div.remove();
  });

  describe('with missing SCL document', () => {
    let editor: OscdMenuValidate;
    beforeEach(async () => {
      editor = await fixture(html`<oscd-menu-validate></oscd-menu-validate>`);

      document.body.prepend(editor);
    });

    afterEach(async () => {
      editor.remove();
    });

    it('looks like the latest snapshot', async () => {
      await editor.updateComplete;

      editor.dialog.show();
      await timeout(200);
      await visualDiff(document.body, `Missing-SCL-document`);
    });
  });

  describe('with loaded doc but not run validation', () => {
    let editor: OscdMenuValidate;
    beforeEach(async () => {
      const doc = new DOMParser().parseFromString(
        invalid2003doc,
        'application/xml'
      );

      editor = await fixture(
        html`<oscd-menu-validate .doc=${doc} docName=""></oscd-menu-validate>`
      );
      document.body.prepend(editor);
    });

    afterEach(async () => {
      editor.remove();
    });

    it('looks like the latest snapshot', async () => {
      await editor.updateComplete;

      editor.dialog.show();
      await timeout(200);
      await visualDiff(document.body, `No-Validation-Run`);
    });
  });

  describe('using template validator', () => {
    const doc = new DOMParser().parseFromString(
      templateIssuesDoc,
      'application/xml'
    );

    describe('with manually run template validation', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${doc}
            docName="InvalidTemplates"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        editor.manualTriggerTemplateValidator.click();

        await timeout(200);
        await visualDiff(document.body, `template/Manual-Run`);
      });
    });

    describe('with hidden template issues', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${doc}
            docName="InvalidTemplates"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.run();
        editor.manualTriggerTemplateValidator.click();

        editor.expandTemplate.click();

        await timeout(200);
        await visualDiff(document.body, `template/Hidden-Issues`);
      });
    });

    describe('with enabled auto validate option', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate .doc=${doc}></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;
        editor.run();

        editor.toggleAutoValidateTemplate.click();
        await editor.updateComplete;

        editor.editCount = 2;
        await timeout(200);

        await visualDiff(
          document.body,
          `template/Auto-Validate-On-EditCount-Change`
        );
      });
    });
  });

  describe('using schema validator', () => {
    const doc = new DOMParser().parseFromString(
      invalid2003doc,
      'application/xml'
    );

    describe('defaults to auto validate', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${doc}
            docName="invalid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Aut-Validate-On-Open-Doc`);
      });
    });

    describe('with manually run schema validation', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate .doc=${doc}></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        editor.manualTriggerSchemaValidator.click();

        await timeout(200);
        await visualDiff(document.body, `schema/Manual-Run`);
      });
    });

    describe('with hidden schema issue', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${doc}
            docName="invalidDoc"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        await editor.run();
        editor.expandSchema.click();

        await timeout(200);
        await visualDiff(document.body, `schema/Hidden-Issues`);
      });
    });

    describe('with disabled auto validate option', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        editor = await fixture(
          html`<oscd-menu-validate .doc=${doc}></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.run();
        editor.toggleAutoValidateSchema.click();

        editor.editCount = 2;

        await timeout(200);
        await visualDiff(
          document.body,
          `schema/Disabled-Auto-Validate-On-EditCount-Change`
        );
      });
    });

    describe('with invalid 2003 (schema 1.7) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const invalid2003 = new DOMParser().parseFromString(
          invalid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${invalid2003}
            docName="invalid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Invalid-Ed1`);
      });
    });

    describe('with valid 2003 (schema 1.7) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const valid2003 = new DOMParser().parseFromString(
          valid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${valid2003}
            docName="valid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Valid-Ed1`);
      });
    });

    describe('with invalid Ed2 (2007B) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const invalid2003 = new DOMParser().parseFromString(
          invalid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${invalid2003}
            docName="invalid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Invalid-Ed2`);
      });
    });

    describe('with valid Ed2 (2007B) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const valid2003 = new DOMParser().parseFromString(
          valid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${valid2003}
            docName="valid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Valid-Ed2`);
      });
    });

    describe('with invalid Ed2.1 (2007B4) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const invalid2003 = new DOMParser().parseFromString(
          invalid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${invalid2003}
            docName="invalid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Invalid-Ed21`);
      });
    });

    describe('with valid Ed2.1 (2007B4) project loaded', () => {
      let editor: OscdMenuValidate;
      beforeEach(async () => {
        const valid2003 = new DOMParser().parseFromString(
          valid2003doc,
          'application/xml'
        );

        editor = await fixture(
          html`<oscd-menu-validate
            .doc=${valid2003}
            docName="valid2003"
          ></oscd-menu-validate>`
        );
        document.body.prepend(editor);
      });

      afterEach(async () => {
        editor.remove();
      });

      it('looks like the latest snapshot', async () => {
        await editor.updateComplete;

        editor.dialog.show();
        await timeout(200);
        await visualDiff(document.body, `schema/Valid-Ed21`);
      });
    });
  });
});
