import * as vscode from "vscode";
export function showSelectWorkspace() {
  vscode.window.showQuickPick(
    [
      <vscode.QuickPickItem>{
        label: "Workspace 1",
        description: "This is workspace 1",
      },
      <vscode.QuickPickItem>{
        label: "Workspace 2",
        description: "This is workspace 2",
      },
      <vscode.QuickPickItem>{
        label: "Workspace 3",
        description: "This is workspace 3",
      },
      <vscode.QuickPickItem>{
        label: "Create new workspace",
        description: "How to create a new workspace",
      },
    ],
    {
      placeHolder: "Choose your Grida workspace.",
    }
  );
}
