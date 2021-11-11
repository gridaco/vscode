import * as vscode from "vscode";
import { GridaExplorerPreviewProvider } from "../grida-explorer-preview";
import { figma_node_utils } from "../_utils";

import { designToCode } from "@designto/code";
import { vanilla_presets } from "@grida/builder-config-preset";
import { config } from "@designto/config";
import {
  ImageRepository,
  MainImageRepository,
} from "@design-sdk/core/assets-repository";
import { RemoteImageRepositories } from "@design-sdk/figma-remote/lib/asset-repository/image-repository";
import { configure_auth_credentials } from "@design-sdk/figma-remote/lib/configure-auth-credentials";
import { fetch } from "@design-sdk/figma-remote";

const FIGMA_PERSONAL_ACCESS_TOKEN = process.env
  .DEV_ONLY_FIGMA_PERSONAL_ACCESS_TOKEN as string;

configure_auth_credentials({
  personalAccessToken: FIGMA_PERSONAL_ACCESS_TOKEN,
});

export class NodeItem extends vscode.TreeItem {
  public readonly collapsibleState: vscode.TreeItemCollapsibleState;
  public readonly filekey: string;
  public readonly nodeid: string;
  public readonly name: string;
  public readonly type: string;
  public readonly previewImage: string | undefined = undefined;
  private _data: any;

  constructor({
    nodeid,
    name,
    type,
    previewImage,
    collapsibleState,
    data,
    filekey,
  }: {
    nodeid: string;
    filekey: string;
    name: string;
    type: string;
    previewImage?: string;
    data?: any;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(name, collapsibleState);
    this.id = nodeid;
    this.nodeid = nodeid;
    this.filekey = filekey;
    this.name = name;
    this.type = type;
    this.previewImage = previewImage;
    this._data = data;
    //

    this.collapsibleState = figma_node_utils.can_have_children(this.type)
      ? collapsibleState
      : vscode.TreeItemCollapsibleState.None;

    this.tooltip = this.markdown;
    this.description = this.type;
  }

  // TODO: provide correct icon per types
  iconPath = this.previewImage && vscode.Uri.parse(this.previewImage);

  get markdown() {
    const _tooltip_markdown = new vscode.MarkdownString(
      `
**${this.name}**

type: \`${this.type}\`

${
  this.type === "TEXT"
    ? `\`\`\`txt
${this.name}
\`\`\``
    : `
${
  this.previewImage
    ? `<img src="${this.previewImage}" alt="Preview of ${this.label}" style="height: 100px; width:100px;"/>`
    : ""
}
`
}
`
    );

    _tooltip_markdown.supportThemeIcons = true;
    _tooltip_markdown.supportHtml = true;
    _tooltip_markdown.isTrusted = true;
    return _tooltip_markdown;
  }

  handleClick() {
    MainImageRepository.instance = new RemoteImageRepositories(this.filekey);
    MainImageRepository.instance.register(
      new ImageRepository(
        "fill-later-assets",
        "grida://assets-reservation/images/"
      )
    );

    GridaExplorerPreviewProvider.Instance.loading(true);

    fetch
      .fetchTargetAsReflect({
        file: this.filekey,
        node: this.nodeid,
        auth: {
          personalAccessToken: FIGMA_PERSONAL_ACCESS_TOKEN,
        },
      })
      .then((res) => {
        const entity = res.reflect!;
        try {
          designToCode({
            input: {
              id: this.nodeid,
              name: this.name,
              entry: entity,
            },
            build_config: {
              ...config.default_build_configuration,
              disable_components: true,
            },
            framework: vanilla_presets.vanilla_default,
            asset_config: { asset_repository: MainImageRepository.instance },
          }).then((result) => {
            GridaExplorerPreviewProvider.Instance.updatePreview({
              srcDoc: result.scaffold.raw,
              id: this.nodeid,
              size: {
                width: entity.width,
                height: entity.height,
              },
            });
          });
        } catch (e) {
          console.error(e);
        }
      })
      .finally(() => {
        GridaExplorerPreviewProvider.Instance.loading(false);
      });
  }
}
