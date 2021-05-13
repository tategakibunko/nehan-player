const pkg = require("../package.json");
const BannerPlugin = require("webpack/lib/BannerPlugin");
const banner = `
${pkg.name} ${pkg.version}
License: ${pkg.license}
Copyright (c) 2021, ${pkg.author}
`;

module.exports = {
  // mode: "development",
  mode: "production",
  entry: {
    "nehan-player": "./nehan-player.ts",
    "advanced": "./advanced.ts",
    "doc-demo": "./doc-demo.ts",
  },
  output: {
    path: __dirname,
    filename: "[name].js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader"
      }
    ]
  },
  plugins: [
    new BannerPlugin({
      banner,
      exclude: [
        "doc-demo.js",
        "advanced.js",
        "theme-test.js"
      ]
    }),
  ]
};


