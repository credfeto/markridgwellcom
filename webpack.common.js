const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const RobotstxtPlugin = require("robotstxt-webpack-plugin");

const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
    entry: {
        app: './src/index.js'
    },
    plugins: [
        new ManifestPlugin(),
        new RobotstxtPlugin(),
        new HtmlWebpackPlugin({
            favicon: 'src/img/favicon.ico',
            template: "src/index.html",
            compile: true,
            inject: false
        }),
        new MiniCssExtractPlugin({
            filename: isDevelopment ? '[name].css' : '[hash].css',
            chunkFilename: isDevelopment ? '[id].css' : '[hash].css'
        })
    ],
    module: {
        rules: [
            {
                test: /\.module\.s(a|c)ss$/,
                loader: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: isDevelopment
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: isDevelopment
                        }
                    }
                ]
            },
            {
                test: /\.s(a|c)ss$/,
                exclude: /\.module.(s(a|c)ss)$/,
                loader: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: isDevelopment
                        }
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|gif|ico)$/,
                use: [
                    'file-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.scss']
    }
};