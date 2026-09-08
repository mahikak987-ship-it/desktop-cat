#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/Desktop Cat.app/Contents/MacOS/Desktop Cat" &
disown
exit 0
