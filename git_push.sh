#!/bin/bash

if [ -z $1 ]; then
  desc="update:"`date +%Y%m%d%H%M`
else
  desc=$1
fi

git add .
git commit -m "$desc"
git push origin HEAD