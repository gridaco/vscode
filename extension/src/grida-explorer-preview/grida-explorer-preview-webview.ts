import * as vscode from "vscode";
import { GRIDA_VDOC_SCHEME } from "../k";
import { webview_utils } from "../_utils";
import { Result } from "@designto/code";
import { dangerously_provide_next_document_content } from "../virtual";
interface PreviewableCodeResult {
  id?: string;
  vanilla: {
    srcDoc: string;
    size?: { width: number; height: number };
  };
  code: Result;
}

export class GridaExplorerPreviewProvider
  implements vscode.WebviewViewProvider
{
  // region singleton
  private static _instance: GridaExplorerPreviewProvider;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  // endregion singleton

  public static readonly viewType = "grida-explorer-preview";

  private _view?: vscode.WebviewView;

  private _preview: PreviewableCodeResult;

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      // console.log("Received message from webview: ", data);

      if (data.__signature === "vscode-side-host-loaded") {
        setTimeout(() => {
          // this.updatePreview(); // TODO: update preview with last selection cache if possible.
        }, 1000);
      }

      if (data.__signature === "event-from-host") {
        if (data.type === "page-loaded") {
        }

        switch (data.type) {
        }
      }
    });
  }

  public updatePreview({
    id = "no-id",
    vanilla = { size: { width: 375, height: 812 }, srcDoc: undefined },
    ...others
  }: PreviewableCodeResult) {
    this._preview = { id, vanilla, ...others };
    this._commandToWebview({
      type: "update-preview",
      preview: {
        id: id,
        srcDoc: vanilla.srcDoc,
        size: vanilla.size,
      },
    });
  }

  private _commandToWebview(command: { type: string; [key: string]: any }) {
    if (this._view) {
      this._view.webview.postMessage({
        __signature: "event-from-client",
        payload: command,
      });
    }
  }

  public loading(isLoading: boolean) {
    this._commandToWebview({
      type: "set-loading",
      isLoading: isLoading,
    });
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
      src: "https://code.grida.co/embed/vscode/grida-explorer-preview",
      height: "100vh",
    });
  }

  public async openInEditor() {
    if (!this._preview) {
      vscode.window.showWarningMessage(
        "Can't open editor. no preview is provided."
      );
    }
    const uri = vscode.Uri.parse(
      GRIDA_VDOC_SCHEME + ":" + "[Preview] preview.tsx"
    );
    dangerously_provide_next_document_content(this._preview.code.scaffold.raw);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
    // opens up with the content via v-doc
  }
}
