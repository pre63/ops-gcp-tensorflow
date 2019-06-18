#!/bin/bash

UUID=$1

echo
echo "Destroying the instance after use"

# Run cloud formation delete stack
aws cloudformation delete-stack --stack-name $UUID

echo
echo "Finished destroying instance!"