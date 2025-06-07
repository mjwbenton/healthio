#!/bin/sh
set -e
prettier --check '**/*' -u --ignore-path ../../.gitignore
tsc --noEmit
