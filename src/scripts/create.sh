#!/bin/bash

UUID=$1

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

ssh-keyscan -H $PUBLIC_IP >> ~/.ssh/known_hosts

chmod 400 /root/creds/tensorflow.pem

scp -i /root/creds/tensorflow.pem ./src/model.py ubuntu@$PUBLIC_IP:/home/ubuntu

# # Appened these before any commands you want to run in the instance
ssh -i /root/creds/tensorflow.pem ubuntu@$PUBLIC_IP "sudo apt-get install software-properties-common -y && \
sudo add-apt-repository ppa:deadsnakes/ppa -y && \
sudo apt-get update -y && \
sudo apt-get install python3.6 && \
sudo apt install python-pip -y && \
sudo pip install --upgrade pip && \
sudo pip install --ignore-installed tensorflow==2.0.0-beta1" >/dev/null

ssh -i /root/creds/tensorflow.pem ubuntu@$PUBLIC_IP "python model.py"

echo "Sucessfully created the instance with name $UUID"
