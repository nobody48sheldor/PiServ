#!/bin/sh

host_ip=$(ifconfig wlan0 | grep 'inet ' | awk '{print $2}')
host_username=$USERNAME

local_ip=$1
dir=$2

echo "host_ip = $host_ip, local_ip = $local_ip, dir = $dir"
