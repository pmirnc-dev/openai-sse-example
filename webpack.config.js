const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require('dotenv-webpack');

module.exports = {
    target: 'node',
    mode: 'production',
    externals: [nodeExternals()],
    entry: './src/app.ts',
    output: {
        filename: 'app.js',
        path: __dirname + '/dist'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            },
        ]
    },
    plugins: [
        new Dotenv(), // MARK: 별로 좋아보이진 않는다
        new CopyPlugin({
            patterns: [
                {
                    from: "src/public",
                    to: "public"
                },
                {
                    from: "src/views",
                    to: "views"
                }
            ]
        })
    ]
}
