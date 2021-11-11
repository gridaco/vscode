import * as vscode from "vscode";
import { Keychain } from "./keychain";
import { AuthProviderType, GridaAuthenticationProvider } from "./provider";

export function __register_auth_manager(context: vscode.ExtensionContext) {
  context.subscriptions.push(new GridaAuthenticationProvider(context));
}

export async function __request_login_if_not(context: vscode.ExtensionContext) {
  let tokens: Array<any>;
  try {
    const payload = await new Keychain(
      context,
      `${AuthProviderType.grida}.auth`
    ).getToken();
    tokens = JSON.parse(payload);
  } catch (e) {}

  // this might broke in the future, but for now our jwt starts with ey, which is `{`.
  if (!(tokens && tokens.length > 0)) {
    try {
      const session = await vscode.authentication.getSession(
        AuthProviderType.grida,
        [],
        {
          createIfNone: true,
          clearSessionPreference: true,
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
}
