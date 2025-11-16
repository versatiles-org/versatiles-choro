#!/bin/bash

image_tag=${1:-versatiles-choro}

nc='\033[0m' # No Color

test() {
  echo -e "\033[1;37mTest: $1${nc}"
}

error() {
  echo -e "\033[0;31mError: $1${nc}"
  exit 1
}

# Test the CLI of the VersaTiles Choro Docker image
test "getting CLI version"
result=$(docker run $image_tag cli -V)
[ $? -eq 0 ] || error "getting CLI version failed"
[[ $result == "1.0.0" ]] || error "unexpected CLI version: $result"


test "running CLI without arguments"
result=$(docker run $image_tag cli 2>&1)
[ $? -eq 1 ] || error "running CLI without arguments should exit with code 1"

result=$(echo -e "$result" | head -n 3)
result="${result//$'\n'/<br>}"
expected_output="Usage: versatiles-choro [options] [command]<br><br>CLI for VersaTiles Choro <https://github.com/versatiles-org/versatiles-choro/>"
[ "$result" == "$expected_output" ] || error "unexpected CLI output: $result"

# Test the server of the VersaTiles Choro Docker image
test "starting server"
id=$(docker run --rm -d -p 3000:3000 $image_tag)
[ $? -eq 0 ] || error "starting server failed"

sleep 1

test "checking server response"
result=$(curl -so /dev/null -w "%{response_code};%{content_type}" "http://localhost:3000/")
[ "$result" == "200;text/html" ] || error "unexpected result: $result"

test "stopping server"
docker stop "$id" > /dev/null
[ $? -eq 0 ] || error "stopping server failed"
