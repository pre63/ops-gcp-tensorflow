#!/bin/bash

UUID=tensorflow-$(uuidgen)

# Run CloudFormation
aws cloudformation create-stack --stack-name $UUID --template-body file://src/cf-template.json >/dev/null

echo "Waiting for stack to be created, hang on!"

aws cloudformation wait stack-create-complete --stack-name $UUID

# Gets the resource ID
RESOURCE_ID=$(aws cloudformation describe-stack-resource --stack-name $UUID --logical-resource-id HelloBucket | jq ".StackResourceDetail.PhysicalResourceId" | sed 's/^"\(.*\)"$/\1/')

echo "Waiting for the instance to finish initializing"

aws ec2 wait instance-status-ok --instance-ids $RESOURCE_ID

# Gets the Public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $RESOURCE_ID --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)

# Appened these before any commands you want to run in the instance
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get install software-properties-common"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo add-apt-repository ppa:deadsnakes/ppa"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get update"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get install -y python3.6"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt install python-pip"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo pip install --upgrade pip"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "pip install --ignore-installed tensorflow==2.0.0-beta0"



# Run SSH commands to:
#
# - Send model.py to server.
# - Run model.py.
# - Report back with results.

# Run cloud formation delete stack

# ops aws-tensorflow report




