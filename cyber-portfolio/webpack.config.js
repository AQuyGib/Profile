const path = require('path');

module.exports = {
    entry: './src/index.js', // Entry point for the application
    output: {
        filename: 'bundle.js', // Output bundle file name
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Transpile JavaScript files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Use Babel for transpiling
                    options: {
                        presets: ['@babel/preset-env'], // Use the env preset
                    },
                },
            },
            {
                test: /\.(glb|gltf|fbx|obj)$/, // Load 3D models
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]', // Preserve original file names
                            outputPath: 'models/', // Output directory for models
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/, // Load image files
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]', // Preserve original file names
                            outputPath: 'textures/', // Output directory for textures
                        },
                    },
                ],
            },
            {
                test: /\.(mp3|wav)$/, // Load audio files
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]', // Preserve original file names
                            outputPath: 'audio/', // Output directory for audio
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js'], // Resolve these extensions
    },
    devtool: 'source-map', // Enable source maps for debugging
    devServer: {
        contentBase: path.join(__dirname, 'dist'), // Serve content from the dist directory
        compress: true, // Enable gzip compression
        port: 9000, // Port for the dev server
    },
};