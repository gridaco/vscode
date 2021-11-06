import * as vscode from "vscode";
import fetch, { Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { PromiseAdapter, promiseFromEvent } from "./utils";
import { AuthProviderType } from "./provider";

const NETWORK_ERROR = "network error";
const AUTH_RELAY_SERVER = "vscode-auth.github.com";

class UriEventHandler
  extends vscode.EventEmitter<vscode.Uri>
  implements vscode.UriHandler
{
  constructor() {
    super();
  }

  public handleUri(uri: vscode.Uri) {
    console.trace("Handling Uri...", uri);
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
  getUserInfo(token: string): Promise<{ id: string; accountName: string }>;
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
): Promise<{ id: string; accountName: string }> {
  let result: Response;
  try {
    console.info("Getting user info...");
    result = await fetch(serverUri.toString(), {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `token ${token}`,
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
    return { id: json.id, accountName: json.login };
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
  private _codeExchangePromises = new Map<
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

  private isTestEnvironment(url: vscode.Uri): boolean {
    return url.authority.startsWith("localhost:");
  }

  private async isNoCorsEnvironment(): Promise<boolean> {
    const uri = await vscode.env.asExternalUri(
      vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.grida-vscode/dummy`)
    );
    return (
      (uri.scheme === "https" &&
        /^((insiders\.)?vscode|github)\./.test(uri.authority)) ||
      (uri.scheme === "http" && /^localhost/.test(uri.authority))
    );
  }

  public async login(scopes: string): Promise<string> {
    console.info(`Logging in for the following scopes: ${scopes}`);

    const callbackUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(
        `${vscode.env.uriScheme}://grida.grida-vscode/did-authenticate`
      )
    );

    if (this.isTestEnvironment(callbackUri)) {
      const token = await vscode.window.showInputBox({
        prompt: "Grida Personal Access Token",
        ignoreFocusOut: true,
      });
      if (!token) {
        throw new Error("Sign in failed: No token provided");
      }

      const tokenScopes = await getScopes(token, this.getServerUri("/")); // Example: ['repo', 'user']
      const scopesList = scopes.split(" "); // Example: 'read:user repo user:email'
      if (
        !scopesList.every((scope) => {
          const included = tokenScopes.includes(scope);
          if (included || !scope.includes(":")) {
            return included;
          }

          return scope.split(":").some((splitScopes) => {
            return tokenScopes.includes(splitScopes);
          });
        })
      ) {
        throw new Error(
          `The provided token does not match the requested scopes: ${scopes}`
        );
      }

      return token;
    }

    this.updateStatusBarItem(true);

    const state = uuid();
    const existingStates = this._pendingStates.get(scopes) || [];
    this._pendingStates.set(scopes, [...existingStates, state]);

    const uri = vscode.Uri.parse(
      `https://${AUTH_RELAY_SERVER}/authorize/?callbackUri=${encodeURIComponent(
        callbackUri.toString()
      )}&scope=${scopes}&state=${state}&responseType=code&authServer=https://github.com`
    );
    await vscode.env.openExternal(uri);

    // Register a single listener for the URI callback, in case the user starts the login process multiple times
    // before completing it.
    let codeExchangePromise = this._codeExchangePromises.get(scopes);
    if (!codeExchangePromise) {
      codeExchangePromise = promiseFromEvent(
        this._uriHandler.event,
        this.exchangeCodeForToken(scopes)
      );
      this._codeExchangePromises.set(scopes, codeExchangePromise!);
    }

    return Promise.race([
      codeExchangePromise?.promise,
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
      codeExchangePromise?.cancel.fire();
      this._codeExchangePromises.delete(scopes);
      this.updateStatusBarItem(false);
    });
  }

  private exchangeCodeForToken: (
    scopes: string
  ) => PromiseAdapter<vscode.Uri, string> =
    (scopes) => async (uri: vscode.Uri, resolve: any, reject: any) => {
      const query = parseQuery(uri);
      const code = query.code;

      const acceptedStates = this._pendingStates.get(scopes) || [];
      if (!acceptedStates.includes(query.state)) {
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

      const url = `https://${AUTH_RELAY_SERVER}/token?code=${code}&state=${query.state}`;
      console.info("Exchanging code for token...");

      try {
        const result = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        });

        if (result.ok) {
          const json: any = await result.json();
          console.info("Token exchange success!");
          resolve(json.access_token);
        } else {
          reject(result.statusText);
        }
      } catch (ex) {
        reject(ex);
      }
    };

  private getServerUri(path: string = "") {
    const apiUri = vscode.Uri.parse("https://api.github.com");
    return vscode.Uri.parse(`${apiUri.scheme}://${apiUri.authority}${path}`);
  }

  private updateStatusBarItem(isStart?: boolean) {
    if (isStart && !this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(
        "status.git.signIn",
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

  public getUserInfo(
    token: string
  ): Promise<{ id: string; accountName: string }> {
    return getUserInfo(token, this.getServerUri("/user"));
  }

  public async checkEnterpriseVersion(token: string): Promise<void> {
    try {
      const result = await fetch(this.getServerUri("/meta").toString(), {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "Visual-Studio-Code",
        },
      });

      if (!result.ok) {
        return;
      }

      const json: {
        verifiable_password_authentication: boolean;
        installed_version: string;
      } = (await result.json()) as any;
    } catch {
      // No-op
    }
  }
}
