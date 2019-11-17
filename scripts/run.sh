#!/usr/bin/env bash

cd ~/Code/galileo-kernel
args="$@"
sbt "run ${args}"

