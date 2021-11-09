import * as vscode from "vscode";
import { webview_utils } from "../_utils";

export class GridaExplorerPreviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "grida-explorer-preview";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      console.log("Received message from webview: ", data);
      switch (
        data.type
        //
      ) {
      }
    });
  }

  public highlight() {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: "addColor" });
    }
  }

  public clearHighlight() {
    if (this._view) {
      this._view.webview.postMessage({ type: "clearColors" });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return webview_utils.makeContainingHtml({
      src: "https://grida.co",
      height: "100vh",
    });
  }
}
