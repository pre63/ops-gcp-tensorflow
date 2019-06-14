#!/bin/bash

# Install python, pip, and tensorflow
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get install software-properties-common"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo add-apt-repository ppa:deadsnakes/ppa"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get update"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt-get install -y python3.6"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo apt install python-pip"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "sudo pip install --upgrade pip"
ssh -i ./src/tensorflowthon.pem ec2-user@$PUBLIC_IP "pip install --ignore-installed tensorflow==2.0.0-beta0"

