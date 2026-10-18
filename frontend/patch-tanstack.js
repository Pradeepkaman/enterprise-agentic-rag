import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToPatch = [
  path.join(__dirname, "node_modules/@tanstack/router-plugin/dist/esm/core/code-splitter/compilers.js"),
  path.join(__dirname, "node_modules/@tanstack/router-plugin/dist/cjs/core/code-splitter/compilers.cjs"),
];

let totalPatched = 0;
for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    const target = "import('${splitUrl}')";
    const replacement = "import(${JSON.stringify(splitUrl)})";
    if (content.includes(target)) {
      content = content.replaceAll(target, replacement);
      fs.writeFileSync(file, content, "utf8");
      console.log(`[patch-tanstack] Successfully patched ${path.basename(file)}`);
      totalPatched++;
    } else {
      console.log(`[patch-tanstack] Already patched: ${path.basename(file)}`);
    }
  }
}

// Patch route-tree-footer.js to resolve junction realpaths and prevent infinite loop
const footerFiles = [
  path.join(__dirname, "node_modules/@tanstack/start-plugin-core/dist/esm/start-router-plugin/route-tree-footer.js"),
];
for (const file of footerFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes('fromDir = fs.realpathSync(fromDir)')) {
      content = content.replace(
        'import path from "pathe";',
        'import fs from "node:fs";\nimport path from "pathe";'
      );
      content = content.replace(
        'let relativePath = path.relative(path.dirname(opts.generatedRouteTreePath), absolutePath);',
        'let fromDir = path.dirname(opts.generatedRouteTreePath);\n\t\tlet target = absolutePath;\n\t\ttry {\n\t\t\tfromDir = fs.realpathSync(fromDir);\n\t\t\ttarget = fs.realpathSync(target);\n\t\t} catch (_) {}\n\t\tlet relativePath = path.relative(fromDir, target);'
      );
      fs.writeFileSync(file, content, "utf8");
      console.log(`[patch-tanstack] Successfully patched ${path.basename(file)} with realpathSync`);
    } else {
      console.log(`[patch-tanstack] Already patched: ${path.basename(file)}`);
    }
  }
}
