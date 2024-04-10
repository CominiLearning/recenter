const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");

module.exports = [
  {
    name: "javascript",
    entry: {
      index: "./src/index.tsx",
      background: "./src/background.ts",
      content: "./src/content.ts",
      superfocus: "./src/html/superfocus.ts",
      blocked: "./src/html/blocked.ts",
    },
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: { noEmit: false },
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          exclude: /node_modules/,
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(png|jpe?g|gif)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                context: "src/images",
                outputPath: "images",
                name: "[path][name].[ext]",
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "manifest.json", to: "../manifest.json" },
          { from: "./src/data/", to: "../data" },
          {
            from: "./src/html/",
            to: "../",
            filter: (resourcePath) => {
              // Check if the file is HTML
              return (
                fs.statSync(resourcePath).isFile() &&
                resourcePath.endsWith(".html")
              );
            },
          },
        ],
      }),
      ...getHtmlPlugins(["index"]),
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      path: path.join(__dirname, "dist/js"),
      filename: "[name].js",
    },
  },
  {
    name: "scss",
    entry: {
      superfocus: "./src/html/superfocus.scss",
    },
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
    },
    output: {
      path: path.join(__dirname, "dist/"),
      filename: "[name].css",
    },
  },
  // {
  //   name: "dom",
  //   entry: {
  //     superfocus: "./src/html/superfocus.ts",
  //   },
  //   mode: "production",
  //   optimization: {
  //     minimize: false,
  //   },
  //   module: {
  //     rules: [
  //       {
  //         test: /\.tsx?$/,
  //         use: [
  //           {
  //             loader: "ts-loader",
  //             options: {
  //               compilerOptions: { noEmit: false },
  //             },
  //           },
  //         ],
  //         exclude: /node_modules/,
  //       },
  //     ],
  //   },
  //   output: {
  //     path: path.join(__dirname, "dist/"),
  //     filename: "[name].js",
  //   },
  // },
];
function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HTMLPlugin({
        title: "React extension",
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
