const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => ({
    entry: './src/index.tsx',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'build'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                            },
                            transform: {
                                react: {
                                    pragma: 'React.createElement',
                                    pragmaFrag: 'React.Fragment',
                                    throwIfNamespace: true,
                                    development: false,
                                    useBuiltins: false,
                                    runtime: 'automatic',
                                },
                            },
                            target: 'es2020',
                            minify:
                                argv.mode === 'production'
                                    ? { compress: true, mangle: true }
                                    : undefined,
                        },
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.svg$/,
                use: ['@svgr/webpack'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'template', 'index.html'),
            filename: 'index.html',
        }),
    ],
});
