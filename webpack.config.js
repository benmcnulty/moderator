const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");
require("dotenv").config();

const keyPath = process.env.LOCALHOST_KEY;
const certPath = process.env.LOCALHOST_CERT;

const key = keyPath ? fs.readFileSync(keyPath, "utf8") : null;
const cert = certPath ? fs.readFileSync(certPath, "utf8") : null;

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    assetModuleFilename: "images/[name][ext]",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.svg/,
        type: "asset/inline",
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    host: "0.0.0.0",
    port: 3100,
    open: false,
    hot: true,
    server: {
      type: "https",
      options: {
        key: key,
        cert: cert,
      },
    },
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/assets/templates/index.html",
      filename: "index.html",
    }),
  ],
};
