import * as vscode from "vscode";
import fetch, { Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { PromiseAdapter, promiseFromEvent } from "./utils";
import { AuthProviderType } from "./provider";
import {
  AuthProxySessionStartRequest,
  AuthProxySessionStartResult,
  __auth_proxy,
} from "@base-sdk-fp/auth";
import { totp } from "otplib";

const NETWORK_ERROR = "network error";

// pre configuration - this is required
__auth_proxy.api.preconfigure({
  useRetry: true,
});

class UriEventHandler
  extends vscode.EventEmitter<vscode.Uri>
  implements vscode.UriHandler
{
  constructor() {
    super();
  }

  public handleUri(uri: vscode.Uri) {
    this.fire(uri);
  }
}

function parseQuery(uri: vscode.Uri) {
  return uri.query.split("&").reduce((prev: any, current) => {
    const queryString = current.split("=");
    prev[queryString[0]] = queryString[1];
    return prev;
  }, {});
}

export interface IGridaServer extends vscode.Disposable {
  login(scopes: string): Promise<string>;
  getUserInfo(token: string): Promise<{ id: string; username: string }>;
  friendlyName: string;
}

async function getScopes(
  token: string,
  serverUri: vscode.Uri
): Promise<string[]> {
  try {
    console.info("Getting token scopes...");
    const result = await fetch(serverUri.toString(), {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "Visual-Studio-Code",
      },
    });

    if (result.ok) {
      const scopes = result.headers.get("X-OAuth-Scopes");
      return scopes
        ? scopes.split(",").map((scope: string) => scope.trim())
        : [];
    } else {
      console.error(`Getting scopes failed: ${result.statusText}`);
      throw new Error(result.statusText);
    }
  } catch (e) {
    console.error(e);
    throw new Error(NETWORK_ERROR);
  }
}

async function getUserInfo(
  token: string,
  serverUri: vscode.Uri
): Promise<{ id: string; username: string }> {
  let result: Response;
  try {
    console.info("Getting user info...");
    result = await fetch(serverUri.toString(), {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${token}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "User-Agent": "Visual-Studio-Code",
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error(NETWORK_ERROR);
  }

  if (result.ok) {
    const json = (await result.json()) as any;
    console.info("Got account info!");
    return { id: json.id, username: json.username };
  } else {
    console.error(`Getting account info failed: ${result.statusText}`);
    throw new Error(result.statusText);
  }
}

export class GridaServer implements IGridaServer {
  friendlyName = "Grida";
  type = AuthProviderType.grida;
  private _statusBarItem: vscode.StatusBarItem | undefined;
  private _onDidManuallyProvideToken = new vscode.EventEmitter<
    string | undefined
  >();

  private _pendingStates = new Map<string, string[]>();
  private _authFromBrowserPromises = new Map<
    string,
    { promise: Promise<string>; cancel: vscode.EventEmitter<void> }
  >();
  private _statusBarCommandId = `${this.type}.provide-manually`;
  private _disposable: vscode.Disposable;
  private _uriHandler = new UriEventHandler();

  constructor() {
    this._disposable = vscode.Disposable.from(
      vscode.commands.registerCommand(this._statusBarCommandId, () =>
        this.manuallyProvideUri()
      ),
      vscode.window.registerUriHandler(this._uriHandler)
    );
  }

  dispose() {
    this._disposable.dispose();
  }

  public async login(scopes: string): Promise<string> {
    console.info(`Logging in for the following scopes: ${scopes}`);

    const callbackUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(
        `${vscode.env.uriScheme}://grida.grida-vscode/did-authenticate`
      )
    );

    this.updateStatusBarItem(true);

    ////
    const requestObj: AuthProxySessionStartRequest = {
      // appId: "co.grida.assistant",
      // clientId: client_id,
      // mode: ProxyAuthenticationMode.long_polling,
      redirect_uri: callbackUri.toString(),
    } as any;

    try {
      const session = await __auth_proxy.api._api_newProxySession(
        reqtoken(),
        requestObj
      );

      const existingStates = this._pendingStates.get(scopes) || [];
      this._pendingStates.set(scopes, [...existingStates, session.id]);

      const uri = vscode.Uri.parse(session.authUrl);
      await vscode.env.openExternal(uri);
    } catch (e) {
      console.error(e);
    }

    // Register a single listener for the URI callback, in case the user starts the login process multiple times
    // before completing it.

    let _ = promiseFromEvent(
      this._uriHandler.event,
      this.checkSessionAuthenticationState(scopes)
    );
    this._authFromBrowserPromises.set(scopes, _);

    return Promise.race([
      _?.promise,
      promiseFromEvent<string | undefined, string>(
        this._onDidManuallyProvideToken.event,
        (token: string | undefined, resolve: any, reject: any): void => {
          if (!token) {
            reject("Cancelled");
          } else {
            resolve(token);
          }
        }
      ).promise,
      new Promise<string>((_, reject) =>
        setTimeout(() => reject("Cancelled"), 60000)
      ),
    ]).finally(() => {
      this._pendingStates.delete(scopes);
      _?.cancel.fire();
      this._authFromBrowserPromises.delete(scopes);
      this.updateStatusBarItem(false);
    });
  }

  private checkSessionAuthenticationState: (
    scopes: string
  ) => PromiseAdapter<vscode.Uri, string> =
    (scopes) => async (uri, resolve, reject) => {
      const query = parseQuery(uri);
      const request_session_id = query.request_session_id;
      const acceptedStates = this._pendingStates.get(scopes) || [];
      if (!acceptedStates.includes(request_session_id)) {
        // A common scenario of this happening is if you:
        // 1. Trigger a sign in with one set of scopes
        // 2. Before finishing 1, you trigger a sign in with a different set of scopes
        // In this scenario we should just return and wait for the next UriHandler event
        // to run as we are probably still waiting on the user to hit 'Continue'
        console.info(
          "State not found in accepted state. Skipping this execution..."
        );
        return;
      }

      try {
        const result = await __auth_proxy.api._api_checkSessionAgain({
          token: reqtoken(),
          session: request_session_id,
        });

        if (result) {
          resolve(result.access_token!);
        } else {
          reject("Authentication not completed on browser");
        }
      } catch (ex) {
        reject(ex);
      }
    };

  private getServerUri(path: string = "") {
    const apiUri = vscode.Uri.parse("http://accounts.services.grida.co");
    return vscode.Uri.parse(`${apiUri.scheme}://${apiUri.authority}${path}`);
  }

  private updateStatusBarItem(isStart?: boolean) {
    if (isStart && !this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(
        "status.grida.signin",
        vscode.StatusBarAlignment.Left
      );
      this._statusBarItem.name = "Grida Sign-in";
      this._statusBarItem.text = "Signing in to grida.co ...";
      this._statusBarItem.command = this._statusBarCommandId;
      this._statusBarItem.show();
    }

    if (!isStart && this._statusBarItem) {
      this._statusBarItem.dispose();
      this._statusBarItem = undefined;
    }
  }

  private async manuallyProvideUri() {
    const uri = await vscode.window.showInputBox({
      prompt: "Uri",
      ignoreFocusOut: true,
      validateInput(value) {
        if (!value) {
          return undefined;
        }
        const error = "Please enter a valid Uri from the Grida login page.";
        try {
          const uri = vscode.Uri.parse(value.trim());
          if (!uri.scheme || uri.scheme === "file") {
            return error;
          }
        } catch (e) {
          return error;
        }
        return undefined;
      },
    });
    if (!uri) {
      return;
    }

    this._uriHandler.handleUri(vscode.Uri.parse(uri.trim()));
  }

  public getUserInfo(token: string): Promise<{ id: string; username: string }> {
    return getUserInfo(token, this.getServerUri("/profile"));
  }
}

// -===

const client_id = "vscode";

const PROXY_AUTH_REQUEST_SECRET: string = process.env
  .GRIDA_FIRST_PARTY_PROXY_AUTH_REQUEST_TOTP_SECRET as string;

export async function startAuthenticationWithSession(
  session: AuthProxySessionStartResult,
  request: AuthProxySessionStartRequest
) {
  const result = await __auth_proxy.requesetProxyAuthWithSession(
    PROXY_AUTH_REQUEST_SECRET,
    session,
    request
  );

  // TODO: save result

  return result;
}

async function isNoCorsEnvironment(): Promise<boolean> {
  const uri = await vscode.env.asExternalUri(
    vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.grida-vscode/dummy`)
  );
  return (
    (uri.scheme === "https" &&
      /^((insiders\.)?vscode|github)\./.test(uri.authority)) ||
    (uri.scheme === "http" && /^localhost/.test(uri.authority))
  );
}

function isTestEnvironment(url: vscode.Uri): boolean {
  return url.authority.startsWith("localhost:");
}

function reqtoken() {
  return totp.generate(PROXY_AUTH_REQUEST_SECRET);
}
