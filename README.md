# README

## Requirements

Please have the following ready:

- AWS credentials in your ~/.aws directory
- Set your region to be `us-east1` (Not yet tested for other regions)
- An ec2 KeyPair named `tensorflow` that exists in your AWS account and region
- A `tensorflow.pem` located in your ~/creds/tensorflow.pem that has access to the ec2 instance's Key Pair in AWS
- A file named `model.py` that contains your tensorflow code

## Commands

### Create
Create will create a EC2 instance with tensorflow installed, and runa your `model.py`.
Flags: `-d` or `--destroy` to immediately destroy the cluster after it finishes computing your code

### Destroy
Takes in a stack name, and deletes all resources to it
