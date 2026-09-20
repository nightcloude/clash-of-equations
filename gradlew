#!/bin/sh
set -e
if command -v gradle >/dev/null 2>&1; then
  exec gradle "$@"
fi
echo "Gradle is not installed. Use GitHub Actions to build this project."
exit 1
