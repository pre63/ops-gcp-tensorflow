#!/bin/bash

UUID=$1

echo "Destroying the instance after use"

# Run cloud formation delete stack
aws cloudformation delete-stack --stack-name $UUID

echo "Finished destroying instance!"