#!/usr/bin/env bash

TIMESTAMP=$(date +%s)
ENV="PROD"
LIMIT=20
SITES_LIST=""
LOGLEVEL="error"

# Remove any previous test run files.
rm -f fail.png
rm -f log.xml

for i in "$@"
do
case $i in
    -e=*|--env=*)
    ENV="${i#*=}"
    ;;
    -l=*|--limit=*)
    LIMIT="${i#*=}"
    ;;
    -v|--verbose)
    LOGLEVEL="debug"
    ;;
    *)
    # unknown option
    ;;
esac
done

if [ "${ENV}" == "TEST" ]; then
    SITES=($(<./sites/test.sh))
else
    SITES=($(<./sites/prod.sh))
fi

# Implode array.
let i=0
while (( ${#SITES[@]} > i )); do
    SITES_LIST="${SITES_LIST} ${SITES[i++]}"
done

# Trim.
SITES_LIST="$(echo -e "${SITES_LIST}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

# Kick off CasperJS.
casperjs test tests/ --sites="${SITES_LIST}" --timestamp=${TIMESTAMP} --logLevel="${LOGLEVEL}" --limit=${LIMIT} --ignore-ssl-errors=true --includes=functions.js --xunit=log.xml
