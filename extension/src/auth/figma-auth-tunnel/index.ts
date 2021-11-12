import { linkedaccounts } from "@base-sdk-fp/accounts";
import { initClient } from "@base-sdk-fp/core";

export async function get_connected_figma_account_info(auth: {
  accessToken: string;
}) {
  const client = initClient(auth);
  const figmaLinkedAccounts = new linkedaccounts.FigmaLinkedAccountsClient(
    client
  );
  const linkedAccount = await figmaLinkedAccounts.getPrimaryLinked();
  return linkedAccount;
}
