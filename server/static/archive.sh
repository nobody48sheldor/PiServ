#!/bin/sh

dir=$2
name=$1
end="$PWD/static/toArchive/${name}.zip"

if [ -z "$dir" ]; then
	echo "NO DIR"
	exit
else
	cd ${dir}
	cd ..
	echo "PWD : " $PWD
	echo zip -r $end $name
	zip -r $end $name
fi
