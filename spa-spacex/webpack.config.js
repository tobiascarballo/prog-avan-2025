const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // punto de entrada
    output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    },
    resolve: {
    extensions: ['.js'],
    },
    module: {
    rules: [
        {
        test: /\.js$/, // babel
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
        },
        },
        {
        test: /\.css$/, // css
        use: ['style-loader', 'css-loader'],
        },
    {
        test: /\.(png|jpg|gif|svg)$/, // imágenes
        type: 'asset/resource',
    },
    ],
},
plugins: [
    new HtmlWebpackPlugin({
        inject: true,
        template: './public/index.html',
        filename: './index.html',
    }),
],
devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 8080,
    historyApiFallback: true,
    },
};