import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class GridaExplorerTreeProvider
  implements vscode.TreeDataProvider<ProjectItem>
{
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ProjectItem): Thenable<ProjectItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve([
        new ProjectItem("Hi", "0.1", vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }
  }
}

class ProjectItem extends vscode.TreeItem {
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
