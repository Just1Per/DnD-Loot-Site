#!/usr/bin/env bash
# GitHub Ubuntu runners can prefer the Azure mirror, which has stalled CI jobs.
# Keep signed Ubuntu repositories and TLS verification; bound all APT retries.
set -euo pipefail
apt_root=${1:-/etc/apt}
[[ -d "$apt_root" ]] || { echo 'APT configuration directory is missing.' >&2; exit 1; }
mkdir -p "$apt_root/apt.conf.d"
cat > "$apt_root/apt.conf.d/80campaignatlas-network" <<'APT'
Acquire::Retries "2";
Acquire::http::Timeout "20";
Acquire::https::Timeout "20";
APT
for source in "$apt_root/apt-mirrors.txt" "$apt_root/sources.list" "$apt_root"/sources.list.d/*.sources "$apt_root"/sources.list.d/*.list; do
  [[ -f "$source" ]] || continue
  sed -E -i 's#https?://azure\.archive\.ubuntu\.com/ubuntu#https://archive.ubuntu.com/ubuntu#g' "$source"
done
printf '%s\n' 'Ubuntu package downloads use bounded retries and the official archive instead of the Azure mirror.'
