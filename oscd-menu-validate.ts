/* eslint-disable import/no-extraneous-dependencies */
import { LitElement, TemplateResult, css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-list';
import '@material/mwc-snackbar';
import '@material/mwc-switch';
import type { Button } from '@material/mwc-button';
import type { Dialog } from '@material/mwc-dialog';
import type { IconButtonToggle } from '@material/mwc-icon-button-toggle';
import type { Snackbar } from '@material/mwc-snackbar';

import { validate } from '@openenergytools/scl-template-validator';
import { Issue } from '@openenergytools/xml-schema-validator';
import { validateSchema } from './schema/validateSchema.js';

/** An editor [[`plugin`]] to configure validators and display their issue centrally */
export default class OscdMenuValidate extends LitElement {
  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc?: XMLDocument;

  /** The name of the document being edited */
  _docName = '';

  @property()
  set docName(docName: string) {
    if (docName === '') return;

    this._docName = docName;
    this.resetValidation();
    this.autoValidate();
  }

  get docName(): string {
    return this._docName;
  }

  /** SCL change indicator */
  @property({ type: Number })
  set editCount(count: number) {
    if (this.doc) this.autoValidate();
  }

  /** Issues return by the schema validator */
  @state() schemaIssues: Issue[] = [];

  /** Issues returned by the template validator */
  @state() templateIssues: Issue[] = [];

  /** Whether schema validator has had the initial run */
  @state() waitForSchemaRun = true;

  /** Whether template validator has had the initial run */
  @state() waitForTemplateRun = true;

  /** Whether schema validator shall run after each change to the doc */
  @state() autoValidateSchema = false;

  /** Whether template validator shall run after each change to the doc */
  @state() autoValidateTemplate = false;

  /** Tracks which issue indices currently show a "copied" checkmark */
  @state() private copiedSet: Set<string> = new Set();

  @query('.content.dialog') dialog!: Dialog;

  @query('.expand.template') expandTemplate!: IconButtonToggle;

  @query('.expand.schema') expandSchema!: IconButtonToggle;

  @query('.run.template') manualTriggerTemplateValidator!: Button;

  @query('.run.schema') manualTriggerSchemaValidator!: Button;

  @query('.alert.schema') alertSchemaIssue!: Snackbar;

  @query('.alert.template') alertTemplateIssue!: Snackbar;

  @query('.auto.schema') toggleAutoValidateSchema!: Snackbar;

  @query('.auto.template') toggleAutoValidateTemplate!: Snackbar;

  async run() {
    if (!this.autoValidateSchema) {
      this.schemaIssues = [];
      this.waitForSchemaRun = true;
    }
    if (!this.autoValidateTemplate) {
      this.templateIssues = [];
      this.waitForTemplateRun = true;
    }
    this.dialog.show();
  }

  private async validateSchema(): Promise<void> {
    this.schemaIssues.length = 0;
    await this.requestUpdate('schemaIssues');

    const result = await validateSchema(this.doc!, this.docName);
    this.schemaIssues = result;
    this.waitForSchemaRun = false;

    if (this.schemaIssues.length && !this.dialog.open) {
      this.alertSchemaIssue.labelText =
        this.schemaIssues[this.schemaIssues.length - 1].title;
      this.alertSchemaIssue.show();
    }

    this.requestUpdate('schemaIssues');
  }

  private async validateTemplates(): Promise<void> {
    this.templateIssues.length = 0;
    this.waitForTemplateRun = false;

    for await (const issue of validate(this.doc!)) {
      this.templateIssues.push(...issue);
      this.requestUpdate('templateIssues');
    }

    if (this.templateIssues.length && !this.dialog.open) {
      this.alertTemplateIssue.labelText =
        this.templateIssues[this.templateIssues.length - 1].title;
      this.alertTemplateIssue.show();
    }

    this.requestUpdate('templateIssues');
  }

  private async autoValidate(): Promise<void> {
    if (this.autoValidateTemplate) this.validateTemplates();
    if (this.autoValidateSchema) this.validateSchema();
  }

  private async resetValidation(): Promise<void> {
    this.schemaIssues.length = 0;
    this.templateIssues.length = 0;

    this.waitForSchemaRun = true;
    this.waitForTemplateRun = true;
  }

  private async copyIssue(key: string, issue: Issue): Promise<void> {
    const text = issue.message
      ? `${issue.title}\n${issue.message}`
      : issue.title;
    await navigator.clipboard.writeText(text);
    this.copiedSet.add(key);
    this.requestUpdate();
    setTimeout(() => {
      this.copiedSet.delete(key);
      this.requestUpdate();
    }, 2000);
  }

  private renderValidatorsIssues(
    issues: Issue[],
    prefix: string,
    hasRun: boolean = false
  ): TemplateResult[] {
    if (issues.length === 0 && hasRun)
      return [
        html`<li divider padded role="separator"></li>`,
        html`<mwc-list-item graphic="icon" noninteractive>
          <mwc-icon slot="graphic" style="color: #4caf50"
            >check_circle</mwc-icon
          >
          <span>No issues found</span>
        </mwc-list-item>`,
      ];
    if (issues.length === 0)
      return [html`<li divider padded role="separator"></li>`];
    return [
      html`<li divider padded role="separator"></li>`,
      ...issues.map(
        (issue, i) =>
          html` <abbr title="${`${issue.title}\n${issue.message}`}">
            <mwc-list-item ?twoline=${!!issue.message} hasMeta noninteractive>
              <span class="issue-title"> ${issue.title}</span>
              <span slot="secondary">${issue.message}</span>
              <mwc-icon-button
                class="copy-btn"
                slot="meta"
                icon="${this.copiedSet.has(`${prefix}-${i}`)
                  ? 'check_circle'
                  : 'content_copy'}"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.copyIssue(`${prefix}-${i}`, issue);
                }}
              ></mwc-icon-button> </mwc-list-item
          ></abbr>`
      ),
    ];
  }

  private renderTemplateValidator(): TemplateResult {
    return html`<div style="display: flex; flex-direction: row">
        <div style="display: flex; flex-direction: column; flex: auto;">
          <div style="display: flex; flex-direction: row">
            <h3 style="flex:auto">
              ${`Template issues (${
                this.waitForTemplateRun
                  ? 'Run template validator'
                  : this.templateIssues.length
              })`}
            </h3>
            <mwc-icon-button-toggle
              class="expand template"
              onIcon="expand_less"
              offIcon="expand_more"
              @click="${() => this.requestUpdate()}"
            ></mwc-icon-button-toggle>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="display:flex; align-items:center; flex:auto">
              <mwc-button
                class="run template"
                style="float: right"
                label="${`${
                  this.waitForTemplateRun ? '' : 'Re-'
                }Run manual validation`}"
                @click="${this.validateTemplates}"
              ></mwc-button>
            </div>
            <div style="display: flex">
              <mwc-formfield label="Auto validate on change" alignEnd>
                <mwc-switch
                  class="auto template"
                  @click="${() => {
                    this.autoValidateTemplate = !this.autoValidateTemplate;
                  }}"
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
        </div>
      </div>
      ${this.expandTemplate && this.expandTemplate.on
        ? html`<mwc-list>
            <li divider padded role="separator"></li>
          </mwc-list>`
        : html`<mwc-list id="content" wrapFocus
            >${this.renderValidatorsIssues(
              this.templateIssues,
              'tpl',
              !this.waitForTemplateRun
            )}</mwc-list
          >`}`;
  }

  private renderSchemaValidator(): TemplateResult {
    return html`<div style="display: flex; flex-direction: row">
        <div style="display: flex; flex-direction: column; flex: auto;">
          <div style="display: flex; flex-direction: row">
            <h3 style="flex:auto">
              ${`Schema issues (${
                this.waitForSchemaRun
                  ? 'Run schema validator'
                  : this.schemaIssues.length
              })`}
            </h3>
            <mwc-icon-button-toggle
              class="expand schema"
              onIcon="expand_less"
              offIcon="expand_more"
              @click="${() => this.requestUpdate()}"
            ></mwc-icon-button-toggle>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="display:flex; align-items:center; flex:auto">
              <mwc-button
                class="run schema"
                style="float: right"
                label="${`${
                  this.waitForSchemaRun ? '' : 'Re-'
                }Run manual validation`}"
                @click="${this.validateSchema}"
              ></mwc-button>
            </div>
            <div style="display: flex">
              <mwc-formfield label="Auto validate on change" alignEnd>
                <mwc-switch
                  class="auto schema"
                  @click="${() => {
                    this.autoValidateSchema = !this.autoValidateSchema;
                  }}"
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
        </div>
      </div>
      ${this.expandSchema && this.expandSchema.on
        ? html`<mwc-list>
            <li divider padded role="separator"></li>
          </mwc-list>`
        : html`<mwc-list id="content" wrapFocus
            >${this.renderValidatorsIssues(
              this.schemaIssues,
              'sch',
              !this.waitForSchemaRun
            )}</mwc-list
          >`}`;
  }

  render(): TemplateResult {
    if (!this.doc)
      return html`<mwc-dialog class="content dialog"
        ><div>No SCL file loaded, yet!</div>
        <mwc-button
          label="Close"
          slot="secondaryAction"
          dialogAction="close"
        ></mwc-button>
      </mwc-dialog>`;

    return html`<mwc-dialog class="content dialog">
        ${this.renderSchemaValidator()}${this.renderTemplateValidator()}
        <mwc-button
          label="Close"
          slot="secondaryAction"
          dialogAction="close"
        ></mwc-button>
      </mwc-dialog>
      <mwc-snackbar class="alert schema" .timeoutMs=${5000}>
        <mwc-button slot="action" @click=${() => this.dialog.show()}
          >DETAIL</mwc-button
        > </mwc-snackbar
      ><mwc-snackbar class="alert template" .timeoutMs=${4000}>
        <mwc-button slot="action" @click=${() => this.dialog.show()}
          >DETAIL</mwc-button
        >
      </mwc-snackbar>`;
  }

  static styles = css`
    mwc-dialog {
      --mdc-dialog-max-width: 90vw;
      --mdc-dialog-min-width: 50vw;
    }

    abbr {
      text-decoration: none;
      border-bottom: none;
    }

    .copy-btn {
      --mdc-icon-size: 18px;
      --mdc-icon-button-size: 32px;
    }

    .copy-btn[icon='check_circle'] {
      color: #4caf50;
    }

    mwc-list-item {
      --mdc-list-item-graphic-margin: 16px;
    }

    mwc-list-item[twoline] {
      height: auto;
      min-height: 72px;
      padding-top: 8px;
      padding-bottom: 8px;
    }

    mwc-list-item span[slot='secondary'] {
      white-space: normal;
    }

    mwc-list-item .issue-title {
      white-space: normal;
    }
  `;
}
