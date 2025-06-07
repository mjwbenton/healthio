#!/bin/sh
set -e
prettier --write '**/*' -u --ignore-path ../../.gitignore
