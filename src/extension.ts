// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable_hello_world = vscode.commands.registerCommand(
    "grida-vscode-extension.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from grida!");
    }
  );

  const disposable_enter_live_session = vscode.commands.registerCommand(
    "grida-vscode-extension.enter-assistant-live-session",
    () => {
      PrimaryPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable_hello_world);
  context.subscriptions.push(disposable_enter_live_session);
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Manages webview panels
 */
class PrimaryPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static instance: PrimaryPanel | undefined;

  public static readonly viewType = "live-session-assistant-synced";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (PrimaryPanel.instance) {
      PrimaryPanel.instance._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      PrimaryPanel.viewType,
      "Live session",
      column || vscode.ViewColumn.One
    );

    PrimaryPanel.instance = new PrimaryPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    PrimaryPanel.instance = new PrimaryPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" });
  }

  public dispose() {
    PrimaryPanel.instance = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Live session</title>
			</head>
			<body>
				<iframe
          src="https://assistant-serve.grida.co/init-webdev"
          sandbox="allow-scripts allow-same-origin allow-popups"
          frameBorder="0"
          allowFullScreen
        />
			</body>
			</html>`;
  }
}
