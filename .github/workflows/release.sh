#!/usr/bin/env bash
set -euo pipefail
shopt -s globstar

# Taken from <https://github.com/dmitmel/cc-world-map-overhaul/blob/dde56e4aa88df3386fd8efe72202ef1b1233a554/.github/workflows/release.sh>
#
# See also:
# <https://github.com/L-Sherry/Bob-Rank/blob/120e7eab2e891771408632d3eea422635936f740/.github/workflows/ccmod.sh>
# <http://h2.jaguarpaw.co.uk/posts/reproducible-tar/>

gha_cmd_escape_data() { # {{{
  # <https://github.com/actions/toolkit/blob/4bf916289e5e32bb7d1bd7f21842c3afeab3b25a/packages/core/src/command.ts#L92-L97>
  local str="$1"
  str="${str//'%'/'%25'}"
  str="${str//$'\n'/'%0A'}"
  str="${str//$'\r'/'%0D'}"
  printf "%s" "$str"
} # }}}

gha_cmd_escape_property() { # {{{
  # <https://github.com/actions/toolkit/blob/4bf916289e5e32bb7d1bd7f21842c3afeab3b25a/packages/core/src/command.ts#L99-L106>
  local str="$1"
  str="${str//'%'/'%25'}"
  str="${str//$'\n'/'%0A'}"
  str="${str//$'\r'/'%0D'}"
  str="${str//','/'%2C'}"
  str="${str//':'/'%3A'}"
  printf "%s" "$str"
} # }}}

gha_command() { # {{{
  # <https://github.com/actions/toolkit/blob/4bf916289e5e32bb7d1bd7f21842c3afeab3b25a/packages/core/src/command.ts#L52-L76>
  # <https://github.com/actions/toolkit/blob/4bf916289e5e32bb7d1bd7f21842c3afeab3b25a/docs/commands.md>
  printf "::"
  gha_cmd_escape_property "$1"
  shift
  while (( $# > 1 )); do
    printf " "
    gha_cmd_escape_property "$1"
    shift
  done
  printf "::"
  if (( $# > 0 )); then
    gha_cmd_escape_data "$1"
    shift
  fi
  printf "\n"
} # }}}

eval "$(jq --raw-output '
  "mod_id=\(.id | @sh)",
  "mod_title=\(.title | @sh)",
  "mod_version=\(.version | @sh)"
' ccmod.json)"

gha_command set-output name=title "${mod_title} v${mod_version}"

mod_files=(
  LICENSE*
  README.md
  ccmod.json
  icon*.png
  package.json
  src/**/*.js
  assets/**/*.json.patch
)

dist_files=()
package_basename="${mod_id}_v${mod_version}"

# There is no way to modify paths before compressing files with the zip
# program, we'll use a symlink instead to trick both tar and zip into
# prepending the base directory name.
ln --symbolic --relative --force --no-target-directory -- . "$mod_id"

rm -f -- "${package_basename}.tgz"
printf "${mod_id}/%s\n" "${mod_files[@]}" | \
  tar --create --gzip --file "${package_basename}.tgz" \
      --numeric-owner --owner=0 --group=0 --files-from=-
dist_files+=("${package_basename}.tgz")

rm -f -- "${package_basename}.zip"
printf "${mod_id}/%s\n" "${mod_files[@]}" | \
  zip --quiet --must-match --no-wild -X --names-stdin "${package_basename}.zip"
dist_files+=("${package_basename}.zip")

rm -f -- "${package_basename}.ccmod"
printf "%s\n" "${mod_files[@]}" | \
  zip --quiet --must-match --no-wild -X --names-stdin "${package_basename}.ccmod"
dist_files+=("${package_basename}.ccmod")

gha_command set-output name=dist_files "$(printf "%s\n" "${dist_files[@]}")"
