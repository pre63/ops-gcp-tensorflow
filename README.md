# README

## Requirements

Please have the following ready:

- AWS credentials in your ~/.aws directory
- Set your region to be `us-east1` (Not yet tested for other regions)
- An ec2 KeyPair named `tensorflow` that exists in your AWS account and region
- A `tensorflow.pem` located in your ~/creds/tensorflow.pem that has access to the ec2 instance's Key Pair in AWS
- `tensorflow.py` in your `src` folder, containing the pyton code you want to run on Tensorflow, if you haven't already

## Commands

### Create

- Create will start an EC2 instance using cloudformation, and runs your `tensorflow.py`
- Resources created through this method will output a `stack name` at the very last. Keep this if you want to delete the instance later on
- Arguments: None
- Flags:
  - `-d` or `--destroy` [OPTIONAL]: Will destroy the instance one it finishes running your python code

*Example:*

```shell
ops run tensorflow-op create -d
```

### Destroy

- Destroys all resources associated with a given `stack name`
- Arguments:
  - StackName [REQUIRED]: The name of the stack you want to delete
- Flags: None

*Example:*

```shell
ops run tensorflow-op delete tensorflow-111111111111-2222-3333-44444444
```
