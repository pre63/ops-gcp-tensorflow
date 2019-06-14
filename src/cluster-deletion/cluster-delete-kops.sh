#!/bin/bash

#Load config file:
source cluster-delete.cfg

# Delete a cluster using kops
if $DELETE_CLUSTER; then
KOPS_CMD="$KOPS_BIN delete cluster \
    --name $CLUSTER_NAME.$DOMAIN \
    --state $KOPS_STATE_STORE \
    --yes"

    $KOPS_CMD
    RC=$?
    if [ "$RC" != "0" ]; then
        echo "Error: Kops command did not complete successfully, Aborting!"
        exit -1
    fi
else
    echo "Skipping deletion of Kops cluster..."
fi