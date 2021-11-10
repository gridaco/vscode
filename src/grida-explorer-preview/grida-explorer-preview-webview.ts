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
      if (data.__signature === "event-from-page") {
        if (data.type === "loaded") {
          this.updatePreview();
        }

        switch (data.type) {
        }
      }
    });
  }

  public updatePreview() {
    this._commandToWebview({
      type: "update-preview",
      preview: {
        id: "",
        srcDoc: "Hello from vscode",
        size: {
          width: 375,
          height: 812,
        },
      },
    });
  }

  private _commandToWebview(command: any) {
    if (this._view) {
      this._view.webview.postMessage({
        __signature: "event-from-client",
        payload: command,
      });
    }
  }

  public focus() {
    this._view?.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
    this._commandToWebview({
      type: "focus-to-layer",
      layer: "",
    });
  }

  public clearFocus() {
    this._commandToWebview({
      type: "clear-focus",
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return webview_utils.makeContainingHtml({
      src: "http://localhost:6626/embed/vscode/grida-explorer-preview",
      height: "100vh",
    });
  }
}
