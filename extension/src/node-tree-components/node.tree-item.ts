import * as vscode from "vscode";
import { figma_node_utils } from "../_utils";

export class NodeItem extends vscode.TreeItem {
  public readonly collapsibleState: vscode.TreeItemCollapsibleState;
  public readonly nodeid: string;
  public readonly name: string;
  public readonly type: string;
  public readonly previewImage: string | undefined = undefined;

  constructor({
    nodeid,
    name,
    type,
    previewImage,
    collapsibleState,
  }: {
    nodeid: string;
    name: string;
    type: string;
    previewImage?: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(name, collapsibleState);
    this.id = nodeid;
    this.nodeid = nodeid;
    this.name = name;
    this.type = type;
    this.previewImage = previewImage;
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
}
