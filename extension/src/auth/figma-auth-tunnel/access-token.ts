import { linkedaccounts } from "@base-sdk-fp/accounts";
import { initClient } from "@base-sdk-fp/core";

export async function get_connected_figma_account_info(auth: {
  accessToken: string;
}): Promise<linkedaccounts.ILinkedFigmaAccount | false> {
  const client = initClient(auth);
  const figmaLinkedAccounts = new linkedaccounts.FigmaLinkedAccountsClient(
    client
  );
  const linkedAccount = await figmaLinkedAccounts.getPrimaryLinked();
  if (notexpired(linkedAccount)) {
    return linkedAccount;
  } else {
    return false;
  }
}

/**
 * validates if figma account is not expired.
 * @param figmaAccount
 * @returns
 */
function notexpired(figmaAccount: linkedaccounts.ILinkedFigmaAccount) {
  if (new Date() > figmaAccount.expiresAt) {
    // expired
    return false;
  }
  return true;
}
