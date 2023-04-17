#!/bin/bash

# This script launches the backend and frontend servers in development mode.
# It is intended to be run from the root directory of the project.

read -p "Open vscode windows? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    bash ./openVSCode.sh
fi

echo launching Backend
cd Backend
npm run start-dev &
echo launching Frontend
cd ../
cd Frontend
ng serve
