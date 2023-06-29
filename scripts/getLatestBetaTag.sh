#!/bin/bash

# Variables
GITHUB_API="https://api.github.com"
REPO_OWNER="iqwertz"
REPO_NAME="depictor"
TAG_PREFIX="Beta"

# Retrieve tags using GitHub API
TAGS=$(curl -s "$GITHUB_API/repos/$REPO_OWNER/$REPO_NAME/tags")

# Check if the request was successful
if [ $? -ne 0 ]; then
    echo "Failed to retrieve tags from GitHub API."
    exit 1
fi

TAG_NAMES=$(echo "$TAGS" | jq -r '.[].name' | grep "^$TAG_PREFIX")

if [ -z "$TAG_NAMES" ]; then
    echo "No tags starting with '$TAG_PREFIX' found for the repository."
else
    echo "TAG=$TAG_NAMES"
fi