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




# Test that build-lib/choro-lib.js exists in the image
log_test "checking build-lib/choro-lib.js exists"
docker run --rm "$image_tag" test -f /app/build-lib/choro-lib.js || error "build-lib/choro-lib.js not found in image"



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



# Test CLI data conversion workflow
temp_dir=$(mktemp -d)
cleanup_temp() {
  rm -rf "$temp_dir"
}
trap cleanup_temp EXIT

log_test "downloading test data"
docker run --rm -v "$temp_dir:/data" "$image_tag" cli download-test-data /data || error "downloading test data failed"

[ -f "$temp_dir/3_kreise.geojson" ] || error "3_kreise.geojson not found after download"

log_test "converting 3_kreise.geojson to versatiles"
docker run --rm -v "$temp_dir:/data" "$image_tag" cli polygons2tiles /data/3_kreise.geojson /data/3_kreise.versatiles || error "converting to versatiles failed"

[ -f "$temp_dir/3_kreise.versatiles" ] || error "3_kreise.versatiles not found after conversion"

file_size=$(stat -f%z "$temp_dir/3_kreise.versatiles" 2>/dev/null || stat -c%s "$temp_dir/3_kreise.versatiles" 2>/dev/null)
[ "$file_size" -gt 1300000 ] || error "3_kreise.versatiles seems too small: $file_size bytes"

# Reset trap for server tests
trap - EXIT
cleanup_temp



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
