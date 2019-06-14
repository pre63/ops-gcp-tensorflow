#!/bin/bash

#Load config file:
source cluster-setup.cfg

# Create a cluster using kops
KOPS_CMD="$KOPS_BIN validate cluster \
    --state $KOPS_STATE_STORE"

    $KOPS_CMD
    RC=$?
    if [ "$RC" != "0" ]; then
        echo "Error: Kops cluster is not validated yet!"
        exit -1
    fi
    exit 0