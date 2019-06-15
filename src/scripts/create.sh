#!/bin/bash

UUID=$1

echo "Starting the cloudformation stack, hang on..."

# Run CloudFormation
aws cloudformation create-stack --stack-name $UUID --template-body file://src/cf-template.json >/dev/null

echo "Starting to initialize instances..."

# Wait for the stack to complete it's creation
aws cloudformation wait stack-create-complete --stack-name $UUID

# Gets the resource ID
RESOURCE_ID=$(aws cloudformation describe-stack-resource --stack-name $UUID --logical-resource-id TensorflowInstance | jq ".StackResourceDetail.PhysicalResourceId" | sed 's/^"\(.*\)"$/\1/')

echo "Waiting for the instance to finish initializing..."
aws ec2 wait instance-status-ok --instance-ids $RESOURCE_ID

# Gets the Public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $RESOURCE_ID --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)

echo "The following output adds the instance to the known hosts"
ssh-keyscan -H $PUBLIC_IP >> ~/.ssh/known_hosts

# Allows the pem key to be executed
chmod 400 /root/creds/tensorflow.pem

echo "Installing the python environment on the instance..."

# # Appened these before any commands you want to run in the instance
ssh -i /root/creds/tensorflow.pem ec2-user@$PUBLIC_IP "sudo yum update -y && \
sudo yum install python36 -y && \
curl -O https://bootstrap.pypa.io/get-pip.py && \
python3 get-pip.py -—user && \
sudo pip install --upgrade pip && \
sudo pip install --ignore-installed tensorflow==2.0.0-beta1" >/dev/null

echo "Running your python tensorflow code..."

# Transfers the model.py file to the container
scp -i /root/creds/tensorflow.pem ./src/model.py ec2-user@$PUBLIC_IP:/home/ec2-user
# Runs the newly-transferred file using python3 and tensorflow2.0
# TODO: Confirm whether this is using tensorflow2.0
ssh -i /root/creds/tensorflow.pem ec2-user@$PUBLIC_IP "python model.py"

echo "Sucessfully created the instance with name $UUID"
