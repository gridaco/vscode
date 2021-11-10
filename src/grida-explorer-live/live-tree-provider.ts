import * as vscode from "vscode";
import * as path from "path";
import { LiveSessionManager } from "./live-session-manager";
import { Client } from "@design-sdk/figma-remote-api";
import { chdir } from "process";
export class GridaExplorerLiveTreeProvider
  implements vscode.TreeDataProvider<NodeItem>
{
  // region singleton
  private static _instance: GridaExplorerLiveTreeProvider;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  // endregion singleton

  private _liveSessionManager: LiveSessionManager;
  private _liveLastSelection: { node: string; filekey: string } | undefined;
  private _apiclient = Client({
    personalAccessToken: process.env
      .DEV_ONLY_FIGMA_PERSONAL_ACCESS_TOKEN as string,
  });
  constructor() {
    this._liveSessionManager = LiveSessionManager.Instance;
    this._liveSessionManager.provideAuthentication(
      // TODO: update with real userid
      process.env.DEV_ONLY_MY_USER_ID as string
    );

    this._liveSessionManager.onSelection((d) => {
      this._liveLastSelection = {
        node: d.node as string,
        filekey: d.filekey as string,
      };
      this.refresh();
    });

    // _liveSessionManager
  }

  private _onDidChangeTreeData: vscode.EventEmitter<NodeItem | undefined> =
    new vscode.EventEmitter<NodeItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<NodeItem | undefined> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: NodeItem): vscode.TreeItem {
    return element;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getChildren(element?: NodeItem): Thenable<NodeItem[]> {
    if (element) {
      if (this._liveLastSelection) {
        return Promise.resolve(
          this.fetchChildren(this._liveLastSelection.filekey, element.nodeid)
        );
      }
    } else {
      if (this._liveLastSelection) {
        // this._liveLastSelection

        return Promise.resolve(
          this.fetch(
            this._liveLastSelection.filekey,
            this._liveLastSelection.node
          )
        );
      }
    }
    return Promise.resolve([]);
  }

  async fetch(filekey: string, ...nodes: string[]): Promise<NodeItem[]> {
    const res = await this._apiclient.fileNodes(filekey, {
      ids: nodes,
      depth: 1,
    });

    const imagemap = await this.fetchPreviewImage(...nodes);

    return Object.keys(res.data.nodes).map((key) => {
      const nodedata = res.data.nodes[key];
      const node = nodedata!.document;
      // fetch image - fetchPreviewImage
      return new NodeItem({
        nodeid: node.id,
        type: node.type,
        name: node.name,
        previewImage: imagemap?.[node.id],
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      });
    });
  }

  async fetchChildren(filekey: string, parent: string): Promise<NodeItem[]> {
    const res = await this._apiclient.fileNodes(filekey, {
      ids: [parent],
      depth: 1,
    });
    const parentNode = res.data.nodes![parent]!.document;
    if ("children" in parentNode) {
      // fetch image - fetchPreviewImage
      const imagemap = await this.fetchPreviewImage(
        ...parentNode.children?.map((child) => child.id)
      );

      return parentNode.children?.map((child) => {
        const node = child;
        return new NodeItem({
          nodeid: node.id,
          type: node.type,
          name: node.name,
          previewImage: imagemap?.[node.id],
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        });
      });
    } else {
      return [];
    }
  }

  async fetchPreviewImage(...nodes: string[]) {
    try {
      if (nodes.length > 0) {
        const res = await this._apiclient.fileImages(
          this._liveLastSelection!.filekey,
          {
            ids: nodes,
          }
        );
        return res.data.images ?? {};
      }
    } catch (e) {
      return {};
    }
  }
}

class NodeItem extends vscode.TreeItem {
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

    this.collapsibleState = can_have_children(this.type)
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

const can_have_children = (type: string) => {
  switch (type) {
    case "COMPONENT":
    case "INSTANCE":
    case "FRAME":
    case "GROUP":
      return true;
    default:
      return false;
  }
};
