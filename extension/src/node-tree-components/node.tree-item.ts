import * as vscode from "vscode";
import { vscodeDesignToCode } from "../design-to-code";
import { figma_node_utils } from "../_utils";
import { GridaExplorerPreviewProvider } from "../grida-explorer-preview";

export class NodeItem extends vscode.TreeItem {
  public readonly collapsibleState: vscode.TreeItemCollapsibleState;
  public readonly filekey: string;
  public readonly nodeid: string;
  public readonly name: string;
  public readonly type: string;
  public readonly previewImage: string | undefined = undefined;
  private _data: any;

  constructor({
    nodeid,
    name,
    type,
    previewImage,
    collapsibleState,
    data,
    filekey,
  }: {
    nodeid: string;
    filekey: string;
    name: string;
    type: string;
    previewImage?: string;
    data?: any;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(name, collapsibleState);
    this.id = nodeid;
    this.nodeid = nodeid;
    this.filekey = filekey;
    this.name = name;
    this.type = type;
    this.previewImage = previewImage;
    this._data = data;
    //

    this.collapsibleState = figma_node_utils.can_have_children(this.type)
      ? collapsibleState
      : vscode.TreeItemCollapsibleState.None;

    this.tooltip = this.markdown;
    this.description = this.type;
  }

  // TODO: provide correct icon per types
  iconPath = this.previewImage && vscode.Uri.parse(this.previewImage);

  get markdown() {
    const _tooltip_markdown = new vscode.MarkdownString(
      `
**${this.name}**

type: \`${this.type}\`

${
  this.type === "TEXT"
    ? `\`\`\`txt
${this.name}
\`\`\``
    : `
${
  this.previewImage
    ? `<img src="${this.previewImage}" alt="Preview of ${this.label}" style="height: 100px; width:100px;"/>`
    : ""
}
`
}
`
    );

    _tooltip_markdown.supportThemeIcons = true;
    _tooltip_markdown.supportHtml = true;
    _tooltip_markdown.isTrusted = true;
    return _tooltip_markdown;
  }

  handleClick() {
    GridaExplorerPreviewProvider.Instance.loading(true);
    vscodeDesignToCode({
      name: this.name,
      filekey: this.filekey,
      nodeid: this.nodeid,
    })
      .then((result) => {
        GridaExplorerPreviewProvider.Instance.updatePreview({
          id: this.nodeid,
          vanilla: {
            srcDoc: result.vanilla.scaffold.raw,
            size: {
              width: result.entity.width,
              height: result.entity.height,
            },
          },
          code: result.result,
        });
      })
      .finally(() => {
        GridaExplorerPreviewProvider.Instance.loading(false);
      });
  }
}
