import * as vscode from "vscode";
import * as path from "path";
import { LiveSessionManager } from "./live-session-manager";

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
      return Promise.resolve([]);
    } else {
      if (this._liveLastSelection) {
        return Promise.resolve([
          new FrameNodeItem(
            this._liveLastSelection.node,
            vscode.TreeItemCollapsibleState.Collapsed
          ),
        ]);
      }

      return Promise.resolve([]);
    }
  }
}

abstract class NodeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.type}`;
    this.description = this.type;
  }
}

class FrameNodeItem extends NodeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, "frame", collapsibleState);
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ),
  };
}
