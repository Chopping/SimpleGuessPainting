const baseConfig = require('./webpack.base.config');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = Object.assign(baseConfig, {
    devServer: {
        hot: true,
        inline: true,
        // open: true,
        // openPage: ''
        proxy: {
            '/proxy': {
                target: 'http://your_api_server.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/proxy': ''
                }
            }
        }
    },
    plugins: (baseConfig.plugins || []).concat([
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            inject: 'body'
        }),
        new webpack.HotModuleReplacementPlugin()
    ])
});