const fs = require("fs");
const path = require("path");
const vscodepackagejson = require("../package.vscode.json.js");
const packagebasejsonpath = path.resolve(__dirname, "../package.base.json");
const packagejsonpath = path.resolve(__dirname, "../package.json");

async function copy() {
  const base = await fs.readFileSync(packagebasejsonpath);

  const final = {
    ...JSON.parse(base),
    ...vscodepackagejson,
  };

  await fs.writeFileSync(packagejsonpath, JSON.stringify(final, null, "\t"));
}

if (require.main === module) {
  copy().catch(console.error);
}
