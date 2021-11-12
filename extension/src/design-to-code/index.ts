import { designToCode } from "@designto/code";
import { vanilla_presets } from "@grida/builder-config-preset";
import { config } from "@designto/config";
import {
  ImageRepository,
  MainImageRepository,
} from "@design-sdk/core/assets-repository";
import { RemoteImageRepositories } from "@design-sdk/figma-remote/lib/asset-repository/image-repository";
import { fetch } from "@design-sdk/figma-remote";
import { configure_auth_credentials } from "@design-sdk/figma-remote/lib/configure-auth-credentials";
import {
  registerOnFigmaPersonalAccessTokenChange,
  getFigmaPersonalAccessToken,
} from "../auth/figma-auth-tunnel";
import * as vscode from "vscode";

registerOnFigmaPersonalAccessTokenChange(
  (pat) => {
    configure_auth_credentials({
      personalAccessToken: pat,
    });
  },
  {
    emmitInitially: true,
  }
);

export async function vscodeDesignToCode({
  name,
  nodeid,
  filekey,
}: {
  name: string;
  nodeid: string;
  filekey: string;
}) {
  MainImageRepository.instance = new RemoteImageRepositories(filekey);
  MainImageRepository.instance.register(
    new ImageRepository(
      "fill-later-assets",
      "grida://assets-reservation/images/"
    )
  );

  const res = await fetch.fetchTargetAsReflect({
    file: filekey,
    node: nodeid,
    auth: {
      personalAccessToken: getFigmaPersonalAccessToken(),
    },
  });

  const entity = res.reflect;
  if (!entity) {
    vscode.window.showErrorMessage("Failed to fetch design from server.");
  }
  try {
    const d2c_res = await designToCode({
      input: {
        id: nodeid,
        name: name,
        entry: entity,
      },
      build_config: {
        ...config.default_build_configuration,
        disable_components: true,
      },
      framework: vanilla_presets.vanilla_default,
      asset_config: { asset_repository: MainImageRepository.instance },
    });

    return {
      entity: entity,
      ...d2c_res,
    };
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage("Failed to convert design to code.", e);
  }
}
