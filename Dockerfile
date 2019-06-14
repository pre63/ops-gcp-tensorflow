############################
# Download container
############################
# FROM alpine:3.6 as downloads

# WORKDIR /downloads

# Download kops and kubectl
# RUN apk add --no-cache curl \
  # && curl -LO https://github.com/kubernetes/kops/releases/download/1.14.0-alpha.2/kops-linux-amd64 \
  # && chmod +x kops-linux-amd64 \
  # && mv kops-linux-amd64 kops \
  # && curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.14.0/bin/linux/amd64/kubectl \
  # && chmod +x kubectl

############################
# Build container
############################
FROM node:10-alpine AS dep

WORKDIR /ops

RUN apk add --no-cache python make
ADD package.json .
RUN npm install

############################
# Final container
############################
FROM node:10-alpine

WORKDIR /ops

RUN apk add --no-cache \
    tar \
    python \
    jq \
    openssh-client \
    apache2-utils \
    util-linux \
    bash \
    ca-certificates \
  && apk add --no-cache \
    --virtual build-dependencies \
      py-pip \
      alpine-sdk \
      python-dev \
      libffi-dev \
      openssl-dev \
  && pip install --upgrade \
    awscli \
    ansible==2.7.8 \
    boto \
    boto3 \
    botocore \
  && apk del build-dependencies

# Added required directory
RUN mkdir /root/creds && mkdir /ops/manifests

# COPY --from=downloads /downloads /usr/local/bin/
COPY --from=dep /ops .
COPY . /ops
