export function makeContainingHtml({
  title = "Untitled",
  width = "100%",
  height = "100%",
  src,
  sandbox = {
    "allow-same-origin": true,
    "allow-scripts": true,
    "clipboard-read": true,
    "clipboard-write": true,
  },
}: {
  title?: string;
  width?: number | string;
  height?: number | string;
  src: string;
  sandbox?: IframeSandboxOptions;
}): string {
  //

  return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          const vscode = acquireVsCodeApi(); // acquireVsCodeApi can only be invoked once
          vscode.postMessage({ message: 'vscode-side-host-loaded' })
          
          // TODO: make this work
          // var iframe = document.getElementsByTagName('iframe')[0],
          // iframe.onLoad = function() {
          //   let iDoc = iframe.contentWindow || iframe.contentDocument;
          //   if (iDoc.document) {
          //     iDoc = iDoc.document;
          //     iDoc.body.addEventListener('message', (e) => {
          //       vscode.postMessage({ message: e });
          //       if (e.data.__signature){
          //       }
          //     });
          //   };
          // }
        </script>
				<title>${title}</title>
			</head>
			<body
        style="
          width: ${wh(width)};
          height: ${wh(height)};
          margin: 0px;
          padding: 0px;
        "
      >
				<iframe
          id="iframe"
          style="width: ${wh(width)}; height: ${wh(height)};"
          src="${src}"
          sandbox="${makesandbox(sandbox)}"
          frameBorder="0"
        />
			</body>
			</html>`;
}

interface IframeSandboxOptions {
  "allow-same-origin"?: boolean | undefined;
  "allow-scripts"?: boolean | undefined;
  "allow-forms"?: boolean | undefined;
  "allow-pointer-lock"?: boolean | undefined;
  "allow-popups"?: boolean | undefined;
  "allow-modals"?: boolean | undefined;
  "allow-presentation"?: boolean | undefined;
  "allow-top-navigation"?: boolean | undefined;
  "clipboard-read"?: boolean | undefined;
  "clipboard-write"?: boolean | undefined;
}

function makesandbox(so: IframeSandboxOptions): string {
  return Object.keys(so)
    .filter((k) => (so as any)[k] === true)
    .map((k) => `${k}`)
    .join(" ");
}

function wh(x: number | string): string {
  return typeof x === "number" ? `${x}px` : x;
}
