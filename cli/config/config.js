const Config = require('webpack-chain'); 
const env = require('./env'); 
const path = require('path');
const PnpWebpackPlugin = require('./plugin/pnp');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const babelConfig = require('./babel.config');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const NyanProgressPlugin = require('nyan-progress-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const options = require('./options')();

let {
  clientEnv,
  globalVar,
  paths,
} = options;


let isDevMode = clientEnv.NODE_ENV === 'development';
let isProdMode = clientEnv.NODE_ENV === 'production';

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

let getStyleLoaders = (cssOptions, preLoader={}) => {
  let loaders = {
    ...!isProdMode?{
      styleLoader: {
        loader: require.resolve('style-loader')
      }
    }: {},

    ...isProdMode ? {
      nimiCss:{
        loader: MiniCssExtractPlugin.loader,
        options: { },
      }
    }: {},
    cssLoader: {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    ...preLoader
  }

  return loaders;
};

let cfg = new Config();

cfg.merge({
  mode: clientEnv.NODE_ENV,
  devtool: isProdMode ? 'cheap-module-source-map' : 'source-map',
  entry: {
    app: [paths.entryPoint]
  },
  output: {
    path: paths.outputPath,
    publicPath: paths.publicPath,
    filename: isProdMode
      ? '[name].[contenthash:8].js'
      : 'bundle.js',
    chunkFilename: isProdMode
      ? '[name].[contenthash:8].chunk.js'
      : '[name].chunk.js',
  },

  module: {
    rule: {
      // name: baseLoader
      baseLoaders: {
        oneOf: {
          // name: image, 
          image: {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          // name: babel
          // only handle app src js
          babel: {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: [paths.appSrc],
            loader: require.resolve('babel-loader'),
            options: babelConfig(),
          },
          // name: css
          css: {
            test: cssRegex,
            exclude: [cssModuleRegex],
            use: getStyleLoaders({
              sourceMap: isProdMode,
            }),
            sideEffects: true,
          },
          // name: cssModule
          cssMosule: {
            test: cssModuleRegex,
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: isProdMode,
              modules: true,
            }),
          },
          // name: sass
          sass: {
            test: sassRegex,
            exclude: [sassModuleRegex],
            use: getStyleLoaders(
              {
                sourceMap: isProdMode,
              },
              {
                sassLoader: {
                  loader: 'sass-loader'
                }
              }
            ),
            sideEffects: true,
          },
          // sassModule
          sassModule: {
            test: sassModuleRegex,
            use: getStyleLoaders(
              {
                sourceMap: isProdMode,
                modules: true,
              },
              {
                sassLoader: {
                  loader: 'sass-loader'
                }
              }
            ),
            sideEffects: true,
          },
          // name: less
          less: {
            test: lessRegex,
            exclude: [lessModuleRegex],
            use: getStyleLoaders(
              {
                sourceMap: isProdMode,
              },
              {
                lessLoader: {
                  loader: 'less-loader'
                }
              }
            ),
            sideEffects: true,
          },
          // lessLoader
          lessModule: {
            test: lessModuleRegex,
            use: getStyleLoaders(
              {
                sourceMap: isProdMode,
                modules: true,
              },
              {
                lessLoader: {
                  loader: 'less-loader'
                }
              }
            ),
          },
          // name: fileCallBack
          fileCallBack: {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          }
        }
      }
    }
  },

  plugin: {
    HtmlWebpackPlugin: {
      plugin: HtmlWebpackPlugin,
      args: [
        {
          template: paths.appHtml,
          ...isProdMode? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }: {}
        }
      ]
    },
    PnpWebpackPlugin: {
      plugin: PnpWebpackPlugin
    },
    DefinePlugin: {
      plugin: webpack.DefinePlugin,
      args: [env.stringified(globalVar)]
    },
    EnvironmentPlugin: {
      plugin: webpack.EnvironmentPlugin,
      args: [env.stringified(clientEnv)]
    },
    ...isDevMode ? {
      HotModuleReplacementPlugin: {
        plugin: webpack.HotModuleReplacementPlugin
      }
    }: {},

    ...isProdMode ? {
      MiniCssExtractPlugin: {
        plugin: MiniCssExtractPlugin,
        args: [{
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }]
      }
    }: {},

    WebpackBuildNotifier: {
      plugin: WebpackBuildNotifierPlugin,
      args: [{
        suppressSuccess: 'initial'
      }]
    },
    NyanProgressPlugin: {
      plugin: NyanProgressPlugin,
      args: [{
        nyanCatSays: (progress, msg) => {
          return progress === 1 ? 'done for you!' : Math.round(progress*100)+'%'
        }
      }]
    },
    // FriendlyErrorsPlugin: {
    //   plugin: FriendlyErrorsPlugin,
    //   args: [{
    //     clearConsole: false,
    //   }]
      
    // }

  },

  resolveLoader: {
    plugin: {
      pnp: {
        plugin: PnpWebpackPlugin.ruxModuleLoader,
        args: [module]
      }
    }
  }

})



module.exports = cfg;