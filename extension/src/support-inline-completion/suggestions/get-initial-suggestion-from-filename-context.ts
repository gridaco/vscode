import * as vscode from "vscode";

/**
 * generates initil suggestion for empty file from context - [filename (path), language]
 */
export async function getInitialSuggestionsFromFileName(
  fileName: string,
  languageId: string
) {
  const ext = fileName.match(/\.[0-9a-z]+$/i)?.[0];

  await sleep(500);

  console.log(languageId, ext);
  switch (languageId) {
    case "typescriptreact": // .tsx
    case "javascriptreact": {
      // .jsx
      // TODO: make it dynamic
      return react_example;
    }
    case "typescript": // .ts
    case "javascript": // .js
    case "dart": {
      // .dart
      return `import "flutter:material.dart"`;
    }
    case "html": // .html, htm
    case "md": // .md, .mdx
    case "css": // .css
    case "scss": // .scss
    case "less": // .less
    case "plaintext": // .sass .vue .txt (these will be recognized as plaintext by vscode)
    case "json": // .json
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function canSuggestInitially(document: vscode.TextDocument) {
  const raw = document.getText();
  // regex \`\s\` -> [" ", "  ", "\n", "\t", ...]
  return !raw.replace(/\s/g, "").length;
}

const react_example = `import React from "react";
import styled from "styled-components";

export function Pricing () {
	return (	
        <RootWrapperPricing>
    <Appbar>
      <Frame33>
        <Frame219>
          <Home src="https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/96f2/23a2/411b352818249e2ec4177f828ee5f822" alt="icon"/>
        <Frame12>
            <BaseHeaderPrimaryMenu>
              <BaseHeaderPrimaryMenu_0001>
                <Rectangle784/>
              <Frame281>
                  <Menu>
                    Products
                  </Menu>
                </Frame281>
              <Indicator/>
              </BaseHeaderPrimaryMenu_0001>
            </BaseHeaderPrimaryMenu>
          <BaseHeaderPrimaryMenu_0002>
              <BaseHeaderPrimaryMenu_0003>                      </Text_0029>
                    </BaseRectangle1040_0025>
                  </PricingCells_0030>
                <PricingCells_0031>
                    <BaseRectangle1040_0026>
                      <Text_0030>
                        Unlimited
                      </Text_0030>
                    </BaseRectangle1040_0026>
                  </PricingCells_0031>
                <PricingCells_0032>
                    <IconsMdiClose_0001 src="https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/a91f/d8a0/453c9d5efcde77bc5bbbd86bbd9cad8a" />
                  </PricingCells_0032>
                </BaseFrame322_0010>
              </Component27_0010>
            </BasePricingTableRow_0010>
          </PricingTableRow_0010>
        <PricingTableRow_0011>
            <BasePricingTableRow_0011>
              <Feature_0011>
                feature
              </Feature_0011>
            <Component27_0011>
                <BaseFrame322_0011>
                  <PricingCells_0033>
                    <BaseRectangle1040_0027>
                      <Text_0031>
                        $999/GB
                      </Text_0031>
                    </BaseRectangle1040_0027>
                  </PricingCells_0033>
                <PricingCells_0034>
                    <BaseRectangle1040_0028>
                      <Text_0032>
                        $999/GB
                      </Text_0032>
                    </BaseRectangle1040_0028>
                  </PricingCells_0034>
                <PricingCells_0035>
                    <BaseRectangle1040_0029>
                      <Text_0033>
                        $999/GB
                      </Text_0033>
                    </BaseRectangle1040_0029>
                  </PricingCells_0035>
                </BaseFrame322_0011>
              </Component27_0011>
            </BasePricingTableRow_0011>
          </PricingTableRow_0011>
        </Frame320_0004>
      </Frame325>
    <Frame326_0001>
        <Frame320_0005>
          <Frame493>
            <Text_0034>
              View all
            </Text_0034>
          <Group534 src="https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/88b5/b16c/3529bc4e1bdbec1124a9585d8a9f9d97" alt="icon"/>
          </Frame493>
        </Frame320_0005>
      </Frame326_0001>
    </Frame326>
  <PricingTableHeader>
      <Frame330>
        <Rectangle1040/>
      <Frame329>
          <Frame328>
            <Free>
              Free
            </Free>
          <Team>
              Team
            </Team>
          <Frame327>
              <ExtraUsage>
                Extra 
              </ExtraUsage>
            <IconsMdiHelp_0001 src="https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/4314/ec1d/cb4c226327e261be5d5625fb30a1114e" />
            </Frame327>
          </Frame328>
        </Frame329>
      </Frame330>
    <Line60/>
    </PricingTableHeader>
  <Features>
      Features
    </Features>
  </RootWrapperPricing>	
    )
}
`;
