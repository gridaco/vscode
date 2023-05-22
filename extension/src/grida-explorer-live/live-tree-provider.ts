import * as vscode from "vscode";
import { LiveSessionManager } from "./live-session-manager";
import { Client, ClientInterface } from "@design-sdk/figma-remote-api";
import { NodeItem } from "../node-tree-components";
import { registerOnFigmaPersonalAccessTokenChange } from "../auth/figma-auth-tunnel";

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
  private _apiclient: ClientInterface;
  constructor() {
    registerOnFigmaPersonalAccessTokenChange(
      (pat) => {
        console.log("livesession: pat changed", pat);
        this._apiclient = Client({
          personalAccessToken: pat,
        });
      },
      {
        emmitInitially: true,
      }
    );
    this._liveSessionManager = LiveSessionManager.Instance;
    console.log("initializing livesession...");
    this._liveSessionManager.provideAuthentication(
      // TODO: update with real userid
      process.env.DEV_ONLY_MY_USER_ID as string
    );

    this._liveSessionManager.onSelection((d) => {
      this._liveLastSelection = {
        node: d.node as string,
        filekey: d.filekey as string,
      };
      console.log("livesession: selection received", d);
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
      if (this._liveLastSelection) {
        return Promise.resolve(
          this.fetchChildren(this._liveLastSelection.filekey, element.nodeid)
        );
      }
    } else {
      if (this._liveLastSelection) {
        console.log(
          "fetching fresh data of selection...",
          this._liveLastSelection.node
        );
        return Promise.resolve(
          this.fetch(
            this._liveLastSelection.filekey,
            this._liveLastSelection.node
          )
        );
      }
    }
    return Promise.resolve([]);
  }

  async fetch(filekey: string, ...nodes: string[]): Promise<NodeItem[]> {
    console.log("fetching", filekey, nodes);
    try {
      const res = await this._apiclient.fileNodes(filekey, {
        ids: nodes,
        depth: 1,
      });

      console.log("fetched", res.data.nodes);

      const imagemap = await this.fetchPreviewImage(...nodes);

      return Object.keys(res.data.nodes).map((key) => {
        const nodedata = res.data.nodes[key];
        const node = nodedata!.document;
        // fetch image - fetchPreviewImage
        return new NodeItem({
          nodeid: node.id,
          type: node.type,
          name: node.name,
          data: node,
          filekey: filekey,
          previewImage: imagemap?.[node.id],
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        });
      });
    } catch (e) {
      console.error("error", e);
      return [];
    }
  }

  async fetchChildren(filekey: string, parent: string): Promise<NodeItem[]> {
    const res = await this._apiclient.fileNodes(filekey, {
      ids: [parent],
      depth: 1,
    });
    const parentNode = res.data.nodes![parent]!.document;
    if ("children" in parentNode) {
      // fetch image - fetchPreviewImage
      const imagemap = await this.fetchPreviewImage(
        ...parentNode.children?.map((child) => child.id)
      );

      return parentNode.children?.map((child) => {
        const node = child;
        return new NodeItem({
          nodeid: node.id,
          type: node.type,
          name: node.name,
          data: node,
          filekey: filekey,
          previewImage: imagemap?.[node.id],
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        });
      });
    } else {
      return [];
    }
  }

  async fetchPreviewImage(...nodes: string[]) {
    try {
      if (nodes.length > 0) {
        const res = await this._apiclient.fileImages(
          this._liveLastSelection!.filekey,
          {
            ids: nodes,
          }
        );
        return res.data.images ?? {};
      }
    } catch (e) {
      return {};
    }
  }
}
