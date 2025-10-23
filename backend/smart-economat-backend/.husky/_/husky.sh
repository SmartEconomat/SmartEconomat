#!/bin/sh

# Husky internal script - DO NOT EDIT
# Load node environment
cd "$(git rev-parse --show-toplevel)" || exit 1

# Load Node/npm environment
if [ -f "$PWD/node_modules/.bin/npm" ]; then
  PATH="$PWD/node_modules/.bin:$PATH"
fi
