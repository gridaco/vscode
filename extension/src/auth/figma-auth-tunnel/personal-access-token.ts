import * as vscode from "vscode";

/**
 * loads the figma personal access token first from configuration, then from keychain, then from .env
 *
 * _currently loading from keychain is not ready_
 *
 * @returns
 */
export function getFigmaPersonalAccessToken(): string {
  let pat: string;

  // pat set from configuration
  pat = vscode.workspace
    .getConfiguration("linkedAccounts.figma")
    .get("personalAccessToken");

  // allow to load pat from .env if development.
  if (!pat && process.env.NODE_ENV === "development") {
    pat = process.env.DEV_ONLY_FIGMA_PERSONAL_ACCESS_TOKEN;
  }

  return pat;
}

export function registerOnFigmaPersonalAccessTokenChange(
  callback: (pat: string) => void,
  opt: {
    emmitInitially: boolean;
  } = {
    emmitInitially: true,
  }
) {
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("linkedAccounts.figma.personalAccessToken")) {
      callback(getFigmaPersonalAccessToken());
    }
  });

  if (opt.emmitInitially) {
    callback(getFigmaPersonalAccessToken());
  }
}
