#!/bin/bash

# 导出当前数据库
echo "Exporting current database..."
mysqldump -u root -p attack > init_dump.sql

# 构建 MySQL 镜像
echo "Building MySQL image..."
docker build -t your-registry/custom-mysql:latest -f Dockerfile.mysql .

# 可选：推送到 Docker 仓库
# docker push your-registry/custom-mysql:latest 