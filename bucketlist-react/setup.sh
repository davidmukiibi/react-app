#!/usr/bin/env bash
set -e

sudo npm install --global gulp-cli
sudo npm install gulp
sudo npm install
gulp sass
npm test