#!/bin/bash

#Load config file:
source cluster-setup.cfg

# Create S3 Bucket
if $CREATE_S3_BUCKET; then
    aws s3 mb $KOPS_STATE_STORE --region $AWS_DEFAULT_REGION
    RC=$?
    if [ "$RC" != "0" ]; then
        echo "Error: Couldn\'t make s3 bucket, Aborting!"
        echo "Please make sure AWS access tokens are valid"
        exit -1
    fi
    echo "Success: S3 bucket created successfully"
else
    echo "Skipping creation of s3 bucket..."
fi

# Create a cluster using kops
if $CREATE_KOPS_CLUSTER; then
KOPS_CMD="$KOPS_BIN create cluster \
    --name $CLUSTER_NAME.$DOMAIN \
    --master-count $MASTER_COUNT \
    --node-count $NODE_COUNT \
    --zones $AVAILABILITY_ZONES \
    --master-zones $AVAILABILITY_ZONES \
    --node-size $NODE_SIZE \
    --master-size $MASTER_SIZE \
    --network-cidr $NETWORK_CIDR \
    --topology public \
    --networking calico \
    --kubernetes-version $KUBERNETES_VERSION \
    --ssh-public-key $SSH_KEY \
    --state $KOPS_STATE_STORE \
    --yes"

    $KOPS_CMD
    RC=$?
    if [ "$RC" != "0" ]; then
        echo "Error: Kops command did not complete successfully, Aborting!"
        exit -1
    fi
    echo "Success: Kubernetes cluster created successfully through kops"
    exit 0

else
    echo Skipping creation of Kops cluster...
fi

# TODO: wait cluster to be ready and call ansible provisioning script