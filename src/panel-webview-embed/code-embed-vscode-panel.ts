import * as vscode from "vscode";

/**
 * Manages webview panels
 */
export class CodeEmbedVscodePanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static instance: CodeEmbedVscodePanel | undefined;

  public static readonly viewType = "live-session-assistant-synced";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (CodeEmbedVscodePanel.instance) {
      CodeEmbedVscodePanel.instance._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      CodeEmbedVscodePanel.viewType,
      "Live session",
      column || vscode.ViewColumn.One
    );

    CodeEmbedVscodePanel.instance = new CodeEmbedVscodePanel(
      panel,
      extensionUri
    );
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    CodeEmbedVscodePanel.instance = new CodeEmbedVscodePanel(
      panel,
      extensionUri
    );
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
    CodeEmbedVscodePanel.instance = undefined;

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
			<body
        style="width: 100vw; height: 100vh"
      >
				<iframe
          style="width: 100vw; height: 100vh"
          src="${code_live_session_url}"
          sandbox="allow-scripts allow-same-origin allow-popups"
          frameBorder="0"
          allowFullScreen
        />
			</body>
			</html>`;
  }
}

const code_live_session_url = "http://localhost:6626/embed/vscode";
