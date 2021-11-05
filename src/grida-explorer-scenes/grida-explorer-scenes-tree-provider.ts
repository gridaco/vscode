import * as vscode from "vscode";
import * as path from "path";

export class GridaExplorerScenesProvider
  implements vscode.TreeDataProvider<SceneItem>
{
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: SceneItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SceneItem): Thenable<SceneItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve([
        new SceneItem("Hi", "0.1", vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }
  }
}

class SceneItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
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
