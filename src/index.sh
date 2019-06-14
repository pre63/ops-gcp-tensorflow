#!/bin/bash

# Ensure / get AWS credentials
aws sts get-caller-identity

# Check for tf.py
cat src/model.py

# Run CloudFormation
# Prachi

# Run SSH commands to:
#
# - Send model.py to server.
# - Run model.py.
# - Report back with results.

# Run cloud formation delete stack
aws cloudformation delete-stack --stack-name foo


# ops aws-tensorflow report




