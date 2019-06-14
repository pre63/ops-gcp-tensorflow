#!/bin/bash

#Load config file:
source cluster-delete.cfg
# Delete S3 Bucket
if $DELETE_S3_BUCKET; then
    aws s3 rb $KOPS_STATE_STORE --region $AWS_DEFAULT_REGION
    RC=$?
    if [ "$RC" != "0" ]; then
        echo "Couldnt delete the s3 bucket, Aborting!"
        echo "Please make sure AWS access tokens are valid"
        exit -1
    fi
else
    echo "Skipping deletion of s3 bucket..."
fi