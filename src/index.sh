#!/bin/bash

# ensure / get AWS credentials
aws sts get-caller-identity

# Check for tf.py
cat src/model.py

# Run CloudFormation

# Run SSH commands to:
# - send model.py to server.
# - Install TF.
# - run tf.py
# - Report back to say that it's started.


# Run cloud formation delete stack



