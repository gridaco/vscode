import * as vscode from "vscode";
import * as path from "path";

const HELP_ITEMS = [
  {
    name: "Getting Started",
    uri: "https://grida.co/docs/vscode/getting-started",
  },
  {
    name: "Read Documentation",
    uri: "https://grida.co/docs/",
  },
  {
    name: "Report Issue",
    uri: "https://github.com/gridaco/vscode-extension/issues/new",
  },
  {
    name: "Ask in Slack",
    uri: "https://www.grida.co/slack",
  },
  {
    name: "View on Github",
    uri: "https://github.com/gridaco/vscode-extension",
  },
];

export class GridaExplorerHelpProvider
  implements vscode.TreeDataProvider<HelpItem>
{
  constructor() {}

  getTreeItem(element: HelpItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HelpItem): HelpItem[] {
    if (element) {
      return [];
    } else {
      return HELP_ITEMS.map((item) => {
        return new HelpItem(item.name, item.uri);
      });
    }
  }
}

export class HelpItem extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly uri: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label}`;
  }

  handleClick() {
    vscode.env.openExternal(vscode.Uri.parse(this.uri));
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "arrow-forward.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "arrow-forward.svg"
    ),
  };
}
