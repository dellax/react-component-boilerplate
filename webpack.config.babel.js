import fs from 'fs';
import path from 'path';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SystemBellPlugin from 'system-bell-webpack-plugin';
import Clean from 'clean-webpack-plugin';
import merge from 'webpack-merge';
import React from 'react';
import ReactDOM from 'react-dom/server';

import App from './demo/App.jsx';
import pkg from './package.json';

import webpackPresets from './lib/presets';
import evaluatePresets from './lib/evaluate_presets';
import resolvePaths from './lib/resolve_paths';
import renderJSX from './lib/render_jsx.jsx';

const webpackrc = JSON.parse(fs.readFileSync('./.webpackrc', {
  encoding: 'utf-8'
}));

const RENDER_UNIVERSAL = true;
const TARGET = process.env.npm_lifecycle_event;

process.env.BABEL_ENV = TARGET;

const commonConfig = {
  plugins: [
    new SystemBellPlugin()
  ]
};
const paths = resolvePaths(__dirname, {
  jsx: ['./demo', './src'],
  png: './demo',
  jpg: './demo',
  json: './package.json',
  css: [
    './demo',
    './style.css',
    './node_modules/purecss',
    './node_modules/highlight.js/styles/github.css',
    './node_modules/react-ghfork/gh-fork-ribbon.ie.css',
    './node_modules/react-ghfork/gh-fork-ribbon.css'
  ]
});
const evaluate = evaluatePresets.bind(null, webpackPresets, webpackrc, TARGET);

if (TARGET === 'start') {
  module.exports = evaluate(paths, merge(commonConfig, {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
      }),
      new HtmlWebpackPlugin({
        title: pkg.name + ' - ' + pkg.description,
        templateContent: renderJSX
      })
    ]
  }));
}

if (TARGET === 'gh-pages') {
  module.exports = evaluate(paths, merge(commonConfig, {
    plugins: [
      new Clean(['gh-pages']),
      new webpack.DefinePlugin({
          // This has effect on the react lib size
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new HtmlWebpackPlugin({
        title: pkg.name + ' - ' + pkg.description,
        templateContent: renderJSX.bind(
          null,
          RENDER_UNIVERSAL ? ReactDOM.renderToString(<App />) : ''
        )
      })
    ]
  }));
}

// !TARGET === prepush hook for test
if (TARGET === 'test' || TARGET === 'tdd' || !TARGET) {
  module.exports = evaluate(Object.assign({}, paths, resolvePaths(__dirname, {
    jsx: ['./src', './tests']
  })), commonConfig);
}

if (TARGET === 'dist' || TARGET === 'dist:min') {
  module.exports = evaluate(paths, commonConfig);
}
