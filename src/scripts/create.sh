#!/bin/bash

UUID=$1

echo
echo "Starting the cloudformation stack, hang on..."

# Run CloudFormation
aws cloudformation create-stack --stack-name $UUID --template-body file://src/cf-template.json >/dev/null

echo
echo "Starting to initialize instances..."

# Wait for the stack to complete it's creation
aws cloudformation wait stack-create-complete --stack-name $UUID >/dev/null

# Gets the resource ID
RES_TMP=$(aws cloudformation describe-stack-resource --output json --stack-name $UUID --logical-resource-id TensorflowInstance)
RES_TMP2=$(jq -n "$RES_TMP" | jq .StackResourceDetail.PhysicalResourceId)
RESOURCE_ID=$(echo $RES_TMP2 | sed 's/^"\(.*\)"$/\1/')

echo
echo "Waiting for the instance to start..."
aws ec2 wait instance-status-ok --instance-ids $RESOURCE_ID >/dev/null

# Gets the Public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $RESOURCE_ID --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)

echo
echo "Sucessfully created cloudfront stack."

# Allows the pem key to be read only by the user
chmod 400 /root/creds/tensorflow.pem

echo
echo "Running tensorflow code..."

# Transfers the tf.py file to the container
scp -q -o StrictHostKeyCHecking=no -i /root/creds/tensorflow.pem ./src/tf.py ubuntu@$PUBLIC_IP:/home/ubuntu

# Runs the newly-transferred file using python3 and tensorflow2.0
# TODO: Confirm whether this is using tensorflow2.0
ssh -q -o StrictHostKeyCHecking=no -i /root/creds/tensorflow.pem ubuntu@$PUBLIC_IP "python tf.py"

echo
echo "Stack name $UUID"
echo "To SSH into the instance execute the following"
echo "ssh -i ~/creds/tensorflow.pem ubuntu@$PUBLIC_IP"

