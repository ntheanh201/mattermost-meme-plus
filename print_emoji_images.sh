#!/bin/bash

# Specify the folder path
folder_path="$1"

# Check if the folder path is provided
if [ -z "$folder_path" ]; then
  echo "Please provide the folder path as an argument."
  exit 1
fi

# Check if the folder exists
if [ ! -d "$folder_path" ]; then
  echo "The specified folder does not exist."
  exit 1
fi

# Get all filenames in the folder
filenames=("$folder_path"/*)

# Check if there are any files in the folder
if [ -z "$filenames" ]; then
  echo "The folder is empty."
  exit 0
fi

# Print all filenames
for filename in "${filenames[@]##*/}"; do
  echo "\""https://raw.githubusercontent.com/ntheanh201/mattermost-emoji-extension/master/img/pepe/$filename"\","
done