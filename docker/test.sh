#!/usr/bin/env bash
set -u -o pipefail

image_tag=${1:-versatiles-choro}

nc='\033[0m' # No Color

log_test() {
  echo -e "\033[1;37mTest: $1${nc}"
}

error() {
  echo -e "\033[0;31mError: $1${nc}"
  exit 1
}




# Test the CLI of the VersaTiles Choro Docker image
log_test "getting CLI version"
result=$(docker run "$image_tag" cli -V) || error "getting CLI version failed"
[[ "$result" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || error "unexpected CLI version format: $result"



log_test "running CLI without arguments"
output=$(docker run "$image_tag" cli 2>&1)
exit_code=$?
[ "$exit_code" -eq 1 ] || error "running CLI without arguments should exit with code 1 (got $exit_code)"

echo "$output" | grep -q "Usage: versatiles-choro" || error "usage line missing in CLI output: $output"
echo "$output" | grep -q "CLI for VersaTiles Choro" || error "description line missing in CLI output: $output"



# Test the server of the VersaTiles Choro Docker image
log_test "starting server"
container_id=$(docker run --rm -d -p 3000:3000 "$image_tag")
[ $? -eq 0 ] || error "starting server failed"
cleanup() {
  if [ -n "$container_id" ]; then
    docker stop "$container_id" > /dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

sleep 1



log_test "checking server response"
result=$(curl -so /dev/null -w "%{response_code};%{content_type}" "http://localhost:3000/")
[ "$result" == "200;text/html" ] || error "expected '200;text/html', got '$result'"



log_test "stopping server"
docker stop "$container_id" > /dev/null
[ $? -eq 0 ] || error "stopping server failed"
