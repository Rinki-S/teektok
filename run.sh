#!/bin/bash

# 检查 .env 文件是否存在
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  # 读取 .env 文件并导出变量，同时忽略注释行
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Creating a template..."
  # 如果不存在，创建一个模板
  echo "# Aliyun OSS Configuration" > .env
  echo "OSS_ACCESS_KEY_ID=" >> .env
  echo "OSS_ACCESS_KEY_SECRET=" >> .env
  echo "Please edit the .env file with your actual keys."
  exit 1
fi

# 检查变量是否已加载
if [ -z "$OSS_ACCESS_KEY_ID" ] || [ -z "$OSS_ACCESS_KEY_SECRET" ]; then
  echo "Error: OSS_ACCESS_KEY_ID or OSS_ACCESS_KEY_SECRET is not set."
  echo "Please check your .env file."
  exit 1
fi

echo "Starting Spring Boot application..."
mvn spring-boot:run
