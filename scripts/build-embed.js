const fs = require("fs");
const path = require("path");

// This script copies index.html as embed.html since we handle embed mode in index.js
const buildDir = path.join(__dirname, "..", "server", "build");
const indexHtml = path.join(buildDir, "index.html");
const embedHtml = path.join(buildDir, "embed.html");

console.log("Building embed widget...");

// Simply copy index.html to embed.html
// The index.js will detect the /embed route and render EmbedApp instead of App
fs.copyFileSync(indexHtml, embedHtml);

console.log("Embed widget built successfully!");
console.log(`Output: ${embedHtml}`);
