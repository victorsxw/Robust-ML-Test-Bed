# Robust-ML-Test-Bed
Task1+Task2+API(python)

20250116
updated V2.0

1 Three seperated pages.
2 Adding generating report function.

waiting for improving items:
1, adding "description" into report 1.
2, considering dataset and model file management.关于dataset的管理：准备一些预设的数据集（cifa10,cifa100, mint, ARP,）,供用户选择，如没有再上传。  关于文件命名，用户名+类型（model+data1+data2）+时间戳，要在用户名创建不重复。





注意事项：
1 关于多个dockers 多个images 的运行问题。前后端分开放在一个不同的容器中。解决见后面注释
2 涉及BM级别的，与NRC沟通由薛老师统一沟通。
3 关于dataset的管理：准备一些预设的数据集（cifa10,cifa100, mint, ARP,）,供用户选择，如没有再上传。  关于文件命名，用户名+类型（model+data1+data2）+时间戳，要在用户名创建不重复。

2025-01-29
准备现有状态制作image放入NRC电脑运行试验。本地image已成功待去NRC运行。

2025-01-29
完成model，training dataset， test dataset文件上传至各自文件夹，命名为model/train_dataset/train_dataset-time stamps-原名字。

2025-2-2
1上传GitHub更新 master分支为 testbed 2.0. 
2 修改命名规则：用户名_类型model/trainingdataset/testdataset_时间戳_原文件名。注意：用户名不能有空格，否则无法传递给python。

2025-2-3
1 v2.5 生成三个images,mysql 8.0 负责数据库（测试成功）， solution-query-web负责前后端程序（测试成功），solutions-query-flask（测试不成功，未调用另一个image处理tensorflow-privacy分析。



###########当你将这些功能部署在 Docker 容器中时，需要注意以下几点：############

1. **文件上传与存储**  
   - **持久化存储**：  
     - Docker 容器内的文件系统是临时的，容器重启或销毁后上传的文件会丢失。如果你的文件（模型文件、数据集等）需要持久保存，最好将目标目录挂载到宿主机的持久化存储卷上。  
     - 例如，在 Docker Compose 或 docker run 命令中挂载数据卷，确保上传文件写入的目录能够持久保存。  
   - **权限设置**：  
     - 确保 Docker 容器中运行应用的用户对挂载的目录有读写权限，否则文件上传可能会失败或写入错误。

2. **调用 Python 程序（后端处理）**  
   - **内部网络调用**：  
     - 在 Docker 中，调用 Python 程序通常是通过容器内的 API 接口进行。确保 API 端点（如 `/api/process`）在容器内可以被正确访问。  
     - 如果 Python 程序在另一个容器中运行，需要配置好容器间的网络通信（例如使用 Docker Compose 的 service 名称互相访问）。  
   - **文件路径和依赖**：  
     - 如果 Python 程序需要访问上传的文件，确保上传的文件存储路径与 Python 程序所读取的路径一致，必要时使用挂载卷来共享数据。

3. **打开本地文件夹**  
   - **文件路径问题**：  
     - 代码中调用 `window.location.href = 'file:///D:/Lee/robust-ai/Attack_Results';` 依赖于固定的本地文件路径，这在 Docker 环境下通常是无效的。  
     - Docker 容器内部的文件系统与宿主机是隔离的，并且容器中通常没有类似 `D:/` 这样的盘符。  
   - **解决方案**：  
     - 如果你希望用户能够访问处理结果，建议改为提供一个通过 HTTP 下载或浏览的接口，而不是直接打开宿主机文件夹。  
     - 或者，可以将结果目录挂载到一个可公开访问的路径，再在页面中生成一个链接，用户点击后通过浏览器下载或查看结果文件。

4. **其他注意事项**  
   - **环境变量与配置**：  
     - 不同环境下（本地 vs Docker），可能存在路径、权限等差异。可以通过环境变量或配置文件来控制各项路径、端口等参数，以便在容器中和本地环境中均能正确运行。  
   - **日志与错误处理**：  
     - 在 Docker 部署时，日志输出（例如上传成功、错误提示等）通常会写入容器日志。确保你有合适的日志收集机制（如 Docker logs 或集中式日志管理）来排查问题。  
   - **跨容器通信**：  
     - 如果前端与 Python 后端分布在不同的容器中，需要确保它们能够通过网络互通，配置好 Docker 网络或使用 Docker Compose 的 service 名称互相引用。

总结来说，部署到 Docker 中主要需要关注数据持久化、正确的路径配置、文件共享以及容器之间的网络通信。特别是直接操作本地文件系统（如打开文件夹）时，由于容器隔离的特性，需要采用更适合 Web 应用的方式来提供文件访问或下载接口。


####关于mysql做成dockers的流程：#############


`mysqldump` 命令需要在命令行中运行，而不是在 PowerShell 中直接运行。以下是一些步骤和建议，帮助你解决这个问题：

### 1. 确保 MySQL 已安装

首先，确保你已经安装了 MySQL，并且可以在命令行中访问 MySQL 客户端。

### 2. 使用命令提示符而不是 PowerShell

在 Windows 上，`mysqldump` 命令通常在命令提示符（cmd）中可用，而不是 PowerShell。请按照以下步骤操作：

1. **打开命令提示符**：
   - 按 `Win + R`，输入 `cmd`，然后按 `Enter`。

2. **运行 `mysqldump` 命令**：
   在命令提示符中，导航到你的项目目录（如果需要），然后运行以下命令：

   ```bash
   mysqldump -u root -p --default-character-set=utf8mb4 attack > init_dump.sql
   ```

### 3. 如果仍然无法识别 `mysqldump`

如果你仍然遇到 `mysqldump` 未被识别的错误，可能是因为 MySQL 的 `bin` 目录没有添加到系统的环境变量中。请按照以下步骤添加：

1. **找到 MySQL 的安装路径**：
   通常在 `C:\Program Files\MySQL\MySQL Server 8.0\bin`。

2. **添加到环境变量**：
   - 右键点击"此电脑"或"我的电脑"，选择"属性"。
   - 点击"高级系统设置"。
   - 在"系统属性"窗口中，点击"环境变量"。
   - 在"系统变量"部分，找到并选择 `Path` 变量，然后点击"编辑"。
   - 点击"新建"，然后添加 MySQL 的 `bin` 目录路径。
   - 点击"确定"保存更改。

3. **重启命令提示符**：
   关闭并重新打开命令提示符，以确保新的环境变量生效。

### 4. 重新运行 `mysqldump` 命令

在命令提示符中，尝试再次运行以下命令：

```bash
mysqldump -u root -p --default-character-set=utf8mb4 attack > init_dump.sql
```

### 5. 将 `init_dump.sql` 放入项目中

如果你已经成功生成了 `init_dump.sql` 文件，并将其放在项目的根目录下，确保在 `docker-compose.yml` 中正确引用：

```yaml:docker-compose.yml
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: yorku2024
      MYSQL_DATABASE: attack
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init_dump.sql:/docker-entrypoint-initdb.d/init_dump.sql  # 使用导出的dump文件
```

### 6. 重新构建并启动 Docker

在项目根目录下，运行以下命令：

```bash
# 停止现有容器
docker-compose down -v

# 重新构建并启动
docker-compose up --build
```

如果在执行这些步骤时遇到任何问题，请告诉我具体的错误信息。





############以下是关于在 Docker 中运行多个镜像的注意事项，以及如何制作和管理 `mysql`、`solutions-query-flask` 和 `solutions-query-web` 三个镜像的总结。您可以将其添加到 `README.md` 文件中。

```markdown
# Docker 多镜像管理注意事项

## 注意事项

1. **镜像和容器的命名**:
   - 确保每个镜像和容器都有清晰且唯一的名称，以避免混淆。
   - 使用一致的命名约定，例如 `solutions-query-flask` 和 `solutions-query-web`。

2. **网络配置**:
   - 使用 Docker 网络来确保不同容器之间可以相互通信。
   - 在 `docker-compose.yml` 中定义网络，并将相关服务连接到同一网络。

3. **卷的使用**:
   - 使用 Docker 卷来持久化数据，确保数据在容器重启或删除后仍然可用。
   - 在 `docker-compose.yml` 中定义卷，并将其挂载到相应的容器路径。

4. **环境变量**:
   - 使用环境变量来配置容器的运行时参数，例如数据库连接信息。
   - 在 `docker-compose.yml` 中定义环境变量，确保敏感信息不硬编码在代码中。

5. **健康检查**:
   - 为服务添加健康检查，以确保容器在启动后正常运行。
   - 在 `docker-compose.yml` 中使用 `healthcheck` 配置。

6. **错误处理**:
   - 在代码中添加适当的错误处理，以便在容器运行时捕获和记录错误。
   - 确保后端服务能够返回清晰的错误信息，以便前端进行处理。

## 镜像制作与功能注释

### 1. MySQL 镜像

**Dockerfile**:
```dockerfile
FROM mysql:8.0

# 设置环境变量
ENV MYSQL_ROOT_PASSWORD=yorku2024
ENV MYSQL_DATABASE=attack

# 持久化数据
VOLUME /var/lib/mysql
```

**功能**:
- 提供数据库服务，存储应用程序数据。
- 使用环境变量配置数据库的根密码和初始数据库。

### 2. Solutions Query Flask 镜像

**Dockerfile**:
```dockerfile
FROM python:3.8

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制应用代码
COPY . .

# 设置环境变量
ENV FLASK_APP=flask_backend/main.py
ENV FLASK_ENV=development

# 启动 Flask 应用
CMD ["flask", "run", "--host=0.0.0.0"]
```

**功能**:
- 提供 Flask API，处理前端请求。
- 调用容器调度器执行分析任务，并返回结果。

### 3. Solutions Query Web 镜像

**Dockerfile**:
```dockerfile
FROM node:14

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json .
RUN npm install

# 复制前端代码
COPY . .

# 启动前端应用
CMD ["npm", "start"]
```

**功能**:
- 提供前端界面，允许用户上传文件并选择实现。
- 通过 Axios 与 Flask 后端进行通信，处理分析请求。

## 总结
通过以上注意事项和镜像制作说明，可以有效管理 Docker 中的多个镜像，确保服务之间的良好协作和数据持久化。这些经验将为未来的项目提供宝贵的参考。
```

您可以将上述内容直接复制到 `README.md` 文件中，确保格式正确并适合您的项目风格。如果需要进一步的修改或添加，请告诉我！


20250205
1 在NRC电脑上部署testbed,成功一般，flaskend的功能因为挂载地址问题，暂时没有联通。
2 http://132.246.129.156:3000/index-02.html（用笔记本访问）
  anydesk地址:1406850063

## 1. 目录结构

*   您创建了以下目录：
/home/your_username/projects/attack_results
    *   `robustai`
    *   `testbed`
    *   `Attack_Results`
    *   `Attack_Scripts`
    *   `User_Models`
    *   `Test_Dataset`
    *   `Train_Dataset`

## 2. Docker 镜像

*   您拉取了以下 Docker 镜像：
    *   `lee074/tensorflow-privacy-library:mim-tensorflow2`
    *   `victorsxw/flaskend:latest`
    *   `victorsxw/website:latest`
    *   `victorsxw/mysql:latest`

## 3. Docker 容器

*   您创建并运行了以下 Docker 容器：
    *   `mysql-container`：基于 `victorsxw/mysql:latest` 镜像，端口映射为 `3306:3306`。
    *   `website-container`：基于 `victorsxw/website:latest` 镜像，端口映射为 `3000:3000`，连接到名为 `my-network-sxw` 的 Docker 网络，并设置了以下环境变量：
        *   `DB_HOST=mysql`
        *   `DB_USER=root`
        *   `DB_PASSWORD=yorku2024`
        *   `DB_NAME=attack`
    *   `flaskend` 容器（具体运行命令未在日志中显示）
    *   `tensorflow-privacy` 容器（具体运行命令未在日志中显示）

## 4. Docker 网络

*   您创建了一个名为 `my-network-sxw` 的 Docker 网络，用于连接 `website-container` 和 `mysql-container`。

## 5. 环境变量

*   在运行 `website-container` 时，您设置了以下环境变量：
    *   `DB_HOST=mysql`
    *   `DB_USER=root`
    *   `DB_PASSWORD=yorku2024`
    *   `DB_NAME=attack`



## Docker 操作日志中文翻译与详解

### 主要操作与结果

1.  **Docker 权限问题：** 您最初尝试在没有 `sudo` 的情况下运行 `docker ps` 命令，遇到了 "permission denied"（权限不足）的错误。这是因为默认情况下，普通用户不属于 `docker` 用户组。`sudo` 可以提升权限，允许命令运行。

2.  **目录创建与导航：** 您创建了多个目录（`robustai`、`testbed`、`Attack_Results`、`Attack_Scripts`、`User_Models`、`Test_Dataset`、`Train_Dataset`），并使用 `cd` 和 `ls` 命令在它们之间导航。

3.  **`apt-get update`：** 您尝试使用 `apt-get update` 命令更新软件包列表，但第一次在没有 `sudo` 的情况下运行失败（权限不足），然后使用 `sudo` 成功运行。出现的关于 Microsoft 密钥存储在旧密钥环中的警告，表明应该及时处理，以避免将来出现问题。

4.  **Docker 镜像操作：**

    *   您使用 `docker images` 命令列出了 Docker 镜像（同样，最初需要 `sudo`）。
    *   您使用 `sudo docker pull` 命令成功拉取了几个镜像：
        *   `lee074/tensorflow-privacy-library:mim-tensorflow2`
        *   `victorsxw/flaskend:latest`
        *   `victorsxw/website:latest`
        *   `victorsxw/mysql:latest`

5.  **运行 Docker 容器：**

    *   您尝试运行一个 MySQL 容器，但遇到了密码环境变量和语法错误。最终，您使用以下命令成功运行了容器：
        `docker run --name mysql-container -p 3306:3306 -d victorsxw/mysql`
    *   然后，您尝试运行 `website` 和 `flaskend` 容器，但最初遇到了名称冲突（因为已经存在具有这些名称的容器）。
    *   之后，您在运行 `website` 容器时遇到了问题，因为数据库 `Attack` 尚未创建。
    *   最终，您通过设置环境变量，成功运行了 `website` 容器，并指定了正确的数据库名称：
        `docker run --name website-container --network my-network-sxw -e DB_HOST=mysql -e DB_USER=root -e DB_PASSWORD=yorku2024 -e DB_NAME=attack -p 3000:3000 -d victorsxw/website`
    *   然后，您成功运行了 `flaskend` 和 `tensorflow-privacy` 容器。

6.  **Docker 网络：** 您使用 `docker network create my-network-sxw` 命令创建了一个名为 `my-network-sxw` 的 Docker 网络。这允许在同一网络上的容器使用容器名称作为主机名进行通信（例如，`website` 容器可以使用主机名 `mysql` 连接到 `mysql` 容器）。

7.  **故障排除：**

    *   您使用 `docker logs` 命令检查容器的日志，这对于调试至关重要。`website` 容器的日志显示了数据库连接问题。
    *   您使用 `docker inspect` 命令查找 mysql 容器的 IP 地址。
    *   您删除并重新创建容器以解决名称冲突。

### 主要问题与解决方案

*   **Docker 权限：** 最初的权限不足错误通过在 Docker 命令前使用 `sudo` 解决。但正确的解决方法是将您的用户添加到 `docker` 用户组：`sudo usermod -aG docker $USER`（然后注销并重新登录，或者运行 `newgrp docker` 以应用组更改）。

*   **容器名称冲突：** 运行容器时出现的"Conflict"错误通过在创建新容器之前使用 `docker rm <container_name>` 删除现有容器来解决。

*   **数据库连接问题：** `website` 容器的连接错误是由于数据库 `Attack` 不存在。通过在 `docker run` 命令中设置 `DB_NAME` 环境变量来解决此问题。

*   **MySQL 密码：** MySQL 容器最初无法启动，因为没有设置密码。通过在 `docker run` 命令中使用 `-e MYSQL_ROOT_PASSWORD=yourpassword` 选项来解决此问题。

*   **网络：** `website` 容器最初无法连接到 MySQL 容器，因为它们不在同一网络上。通过创建 Docker 网络(network-sxw)并在该网络上运行两个容器来解决此问题。

20250205

在NRC上基本成功，目前唯一问题就是tensorflow-privcay每次调用后就下线，下线后再启动挂载就失效了。
下面是设定和运行相应container的命令：

 docker run -d --name tensorflow-privacy --network my-network-sxw -v /home/xueli/robustai/Attack_Scripts:/tf/scripts -v /home/xueli/robustai/User_Models:/tf/models -v /home/xueli/robustai/Attack_Results:/tf/results lee074/tensorflow-privacy-library:mim-tensorflow2 tail -f /dev/null

docker run -d --name flaskend --network my-network-sxw -p 5000:5000 -v /home/xueli/robustai/Attack_Scripts:/tf/scripts -v /home/xueli/robustai/User_Models:/tf/models -v /home/xueli/robustai/Attack_Results:/tf/results -v /var/run/docker.sock:/var/run/docker.sock -e IS_DOCKER=true -e PYTHONPATH=/app -e TF_SCRIPTS_PATH=/tf/scripts -e TF_MODELS_PATH=/tf/models -e TF_RESULTS_PATH=/tf/results -e FLASK_DEBUG=1 victorsxw/flaskend

docker run -d --name website --network my-network-sxw -p 3000:3000 -e FLASK_SERVICE_URL=http://flaskend:5000 -e DB_HOST=mysql -e DB_USER=root -ORD=yorku2024 -e DB_NAME=attack -e NODE_ENV=production -e IS_DOCKER=true  victorsxw/website

docker run --name mysql --network my-network-sxw -e MYSQL_ROOT_PASSWORD=yorku2024 -d victorsxw/mysql

20250206
以下为NRC电脑 /home/xueli/robustai/docker-compose.yml,只能运行一次flaskend，然后container清理后再次调用，因为挂载问题就出错。如果用上面的tensorflow命令配置一下，就可以再用一次。问题待解决。
 

最新更新（2024-04-23）：
文件上传增强（支持 .h5 和 .pt 格式）
调试通过flask_backend的更新后的程序：
1 在王乐源程序上更新了main函数中image名字（根据pull后本地dockers中的名字）
2 zhuoxin的script的implementation——ID没有按数据库的来，我已修改。
UI 改进：增加posion, evasion的数值输入，已调试完毕

# 问题记录与解决方案
## 2025-04-24: 报告生成中图片显示问题

### 问题描述
在生成的报告中，Results Diagram 部分无法正确显示图片。具体表现为：
1. 图片文件实际存在于 `D:\Lee\robust-ai\Attack_Results` 目录下
2. 报告中显示 "No image available for [implementation_id]"
3. 前端无法正确加载图片资源

### 问题原因
1. 服务器端静态文件服务配置不完整
2. 图片路径处理逻辑存在问题
3. 文件名大小写敏感性导致的路径匹配失败

### 解决方案
1. 修改服务器端代码，添加自定义中间件处理文件名大小写不敏感的匹配：
```javascript
app.use('/api/attack-results', (req, res, next) => {
    const requestedFile = path.basename(req.path).toLowerCase();
    const attackResultsDir = 'D:/Lee/robust-ai/Attack_Results';
    
    fs.readdir(attackResultsDir, (err, files) => {
        if (err) {
            console.error('Error reading Attack_Results directory:', err);
            return next();
        }
        
        const matchingFile = files.find(file => file.toLowerCase() === requestedFile);
        if (matchingFile) {
            res.sendFile(path.join(attackResultsDir, matchingFile));
        } else {
            next();
        }
    });
});
```

2. 更新前端代码中的图片路径处理逻辑：
- 统一使用小写文件名来匹配图片文件
- 正确处理 implementation ID 的格式
- 优化错误处理和日志记录

### 经验总结
1. 在处理文件路径时，需要考虑操作系统的大小写敏感性
2. 服务器端静态文件服务应该具有足够的容错能力
3. 文件名匹配时应该采用更灵活的方式，如大小写不敏感的匹配
4. 完善的错误处理和日志记录有助于快速定位和解决问题

### 相关文件
- `server.js`: 服务器端静态文件服务配置
- `reportGenerator.js`: 报告生成和图片路径处理
- `reportConfig.js`: 报告相关配置


version: '3.8'

services:
 mysql:
   image: victorsxw/mysql
   container_name: mysql
   environment:
     MYSQL_ROOT_PASSWORD: yorku2024
   networks:
     - my-network-sxw
   volumes:
     - mysql_data:/var/lib/mysql
   healthcheck:
     test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
     interval: 10s
     timeout: 5s
     retries: 5

 tensorflow-privacy:
   image: lee074/tensorflow-privacy-library:mim-tensorflow2
   container_name: tensorflow-privacy
   tty: true
   volumes:
     - attack-scripts:/tf/scripts
     - user-models:/tf/models
     - attack-results:/tf/results
   networks:
     - my-network-sxw
   depends_on:
     - mysql

 flaskend:
   image: victorsxw/flaskend
   container_name: flaskend
   ports:
     - "5000:5000"
   volumes:
     - attack-scripts:/tf/scripts
     - user-models:/tf/models
     - attack-results:/tf/results
     - /var/run/docker.sock:/var/run/docker.sock
   environment:
     - IS_DOCKER=true
     - PYTHONPATH=/app
     - TF_SCRIPTS_PATH=/tf/scripts
     - TF_MODELS_PATH=/tf/models
     - TF_RESULTS_PATH=/tf/results
     - FLASK_DEBUG=1
   networks:
     - my-network-sxw
   depends_on:
     - mysql
     - tensorflow-privacy

 website:
   image: victorsxw/website
   container_name: website
   ports:
     - "3000:3000"
   volumes:
     - attack-results:/app/Attack_Results
     - attack-scripts:/app/Attack_Scripts
     - test-dataset:/app/Test_Dataset
     - train-dataset:/app/Train_Dataset
     - user-models:/app/User_Models
   environment:
     - NODE_ENV=production
     - IS_DOCKER=true
     - DB_HOST=mysql
     - DB_USER=root
     - DB_PASSWORD=yorku2024
     - DB_NAME=attack
     - FLASK_SERVICE_URL=http://flaskend:5000
   depends_on:
     mysql:
       condition: service_healthy
     flaskend:
       condition: service_started
   networks:
     - my-network-sxw

networks:
 my-network-sxw:
   driver: bridge

volumes:
 mysql_data:
 attack-scripts:
   driver: local
   driver_opts:
     type: bind
     o: bind
     device: /home/xueli/robustai/Attack_Scripts

 user-models:
   driver: local
   driver_opts:
     type: bind
     o: bind
     device: /home/xueli/robustai/User_Models

 attack-results:
   driver: local
   driver_opts:
     type: bind
     o: bind
     device: /home/xueli/robustai/Attack_Results

 test-dataset:
   driver: local
   driver_opts:
     type: bind
     o: bind
     device: /home/xueli/robustai/Test_Dataset

 train-dataset:
   driver: local
   driver_opts:
     type: bind
     o: bind
     device: /home/xueli/robustai/Train_Dataset

## 2025-04-24: 报告生成功能增强

### 更新内容
1. 重构了报告的"FINDINGS & EXPLOITS"部分：
   - 移除了原有的漏洞列表展示方式
   - 新增了结构化的攻击类型表格，包含：
     * Membership Inference Attacks (MIAs)
     * Reconstruction Attacks (RAs)
     * Poisoning and Backdoor Attacks (PA/BA)
     * Evasion Attacks (EA)

2. 表格内容优化：
   - Implementation_ID 列：展示完整的实现ID列表
   - Privacy Attack Type 列：清晰展示攻击类型
   - Defense Suggestions 列：按类别组织防御建议
     * Model-level defences
     * System-level controls
     * Core principles
     * 具体防御策略和建议

3. 样式优化：
   - 使用合适的间距和对齐方式
   - 为不同攻击类型设置不同的文字颜色
   - 优化表格布局和可读性

### 技术细节
1. 表格结构采用 HTML table 元素实现
2. 使用 CSS 样式控制表格外观：
   - 设置边框和内边距
   - 控制文本对齐和换行
   - 添加适当的间距
3. 实现响应式设计，确保在不同设备上的良好显示效果

### 下一步计划
1. 进一步优化报告生成功能
2. 添加更多数据可视化元素
3. 改进报告的打印和导出功能

## 2025-04-25: Docker 环境下的文件路径和地址绑定问题解决

### 问题描述
在 Docker 环境中运行时，遇到以下主要问题：
1. 报告生成时无法正确显示图片和 JSON 文件
2. 容器内外文件路径映射不一致
3. 静态文件服务访问权限问题

### 解决方案

#### 1. Docker 容器路径映射
在 Docker 环境中，需要注意以下路径映射关系：
```yaml
# 主机路径 -> 容器内路径
D:/Lee/robust-ai/Attack_Results -> /app/Attack_Results
D:/Lee/robust-ai/Attack_Scripts -> /app/Attack_Scripts
D:/Lee/robust-ai/User_Models -> /app/User_Models
D:/Lee/robust-ai/Test_Dataset -> /app/Test_Dataset
D:/Lee/robust-ai/Train_Dataset -> /app/Train_Dataset
```

#### 2. 服务器端配置
在 `server.js` 中添加正确的静态文件服务和路由处理：
```javascript
// 静态文件服务 - Attack_Results 目录
app.use('/app/Attack_Results', express.static('/app/Attack_Results', {
    setHeaders: (res, path) => {
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));

// 结果文件路由处理 - 支持大小写不敏感的文件匹配
app.get('/app/Attack_Results/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('/app/Attack_Results', filename);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            const dir = '/app/Attack_Results';
            fs.readdir(dir, (err, files) => {
                if (err) {
                    return res.status(404).send('File not found');
                }
                
                const matchingFile = files.find(file => 
                    file.toLowerCase() === filename.toLowerCase()
                );
                
                if (matchingFile) {
                    res.sendFile(path.join(dir, matchingFile));
                } else {
                    res.status(404).send('File not found');
                }
            });
        } else {
            res.sendFile(filePath);
        }
    });
});
```

#### 3. 前端配置
在 `reportConfig.js` 中设置正确的路径配置：
```javascript
// 文件资源路径配置
paths: {
    results: '/app/Attack_Results',  // 使用容器内的路径
    images: '/assets/images'
},
```

#### 4. Docker Compose 配置
在 `docker-compose.yml` 中正确配置卷映射：
```yaml
services:
  web:
    volumes:
      - D:/Lee/robust-ai/Attack_Results:/app/Attack_Results
      - D:/Lee/robust-ai/Attack_Scripts:/app/Attack_Scripts
      - D:/Lee/robust-ai/Test_Dataset:/app/Test_Dataset
      - D:/Lee/robust-ai/Train_Dataset:/app/Train_Dataset
      - D:/Lee/robust-ai/User_Models:/app/User_Models
```

### 注意事项
1. 确保容器内外的文件权限正确设置
2. 使用绝对路径进行卷映射
3. 文件路径匹配时需要考虑大小写敏感性
4. 正确设置文件的 MIME 类型
5. 确保网络请求使用正确的 URL 路径

### 最佳实践
1. 使用环境变量来配置路径，避免硬编码
2. 实现健康检查机制确保服务正常运行
3. 添加适当的错误处理和日志记录
4. 定期检查文件权限和访问日志
5. 使用 Docker 网络确保容器间通信正常

## 2025-04-26: 其他功能改进

1. 文件上传功能增强：
   - 支持 .h5 和 .pt 格式的模型文件
   - 优化文件命名规则
   - 添加文件类型验证

2. Flask 后端更新：
   - 更新 main 函数中的 image 名称配置
   - 修正 implementation_ID 的命名规则
   - 优化容器调度逻辑

3. UI 改进：
   - 新增 poison rate 输入框
   - 新增 evasion 参数配置
   - 优化用户交互体验

4. 报告生成功能优化：
   - 改进图表展示
   - 优化分析结果展示
   - 增强报告导出功能


Image rescours:

tensorflow privacy:
docker pull lee074/robustai:mim-tensorflow2
privacymeter:
docker pull lee074/robustai:privacymeter
art_evasion:
docker pull lee074/robustai:art_evasion
art_poison:
docker pull lee074/robustai:art-poison

flaskend :
docker pull victorsxw/robustai:flaskend

SQL :
docker pull victorsxw/robustai:mysql

website:
docker pull victorsxw/robustai:website


docker hub 链接：https://hub.docker.com/r/lee074/robustai/tags

主要的操作：
sudo docker ps
sudo docker logs flaskend
sudo docker container ls -a
sudo docker image ls -a

sudo docker-compose up
sudo docker-compose down


sudo docker stop mysql website flaskend
sudo docker rm mysql website flaskend

sudo nano docker-compose.yml #改写文件



Json format:
[
  {
      implementation_ID: 'Tensorflow_privacy_MIM_006',
      upload_file_name: 'sxw_model_1745454840427_user_upload_for_test'
  }
]

20250521

1 部署NRC电脑基本成功：
  前端地址：http://132.246.129.156:3000/
  后端操作：sudo docker-compose up
  
2 注意事项：
 （1）修改docker-compose.yml 为 docker-compose（NRC）.yml， 主要修改如下：

      ## docker-compose.yml 与 docker-compose(NRC).yml 的主要区别

      ### 1. 镜像来源
      - **docker-compose.yml**:
        - 使用本地构建的镜像（通过 Dockerfile 构建）
        - 使用 `build` 指令指定构建上下文和 Dockerfile

      - **docker-compose(NRC).yml**:
        - 直接使用预构建的镜像（从 Docker Hub 拉取）
        - 使用 `image` 指令指定镜像名称和标签
        - 例如：`image: victorsxw/robustai:mysql`

      ### 2. 卷挂载方式
      - **docker-compose.yml**:
        - 使用相对路径进行挂载
        - 例如：`./Attack_Scripts:/tf/scripts`

      - **docker-compose(NRC).yml**:
        - 使用命名卷（named volumes）进行挂载
        - 通过 `driver_opts` 指定具体的挂载点
        - 例如：
          ```yaml
          attack-scripts:
            driver: local
            driver_opts:
              type: bind
              o: bind
              device: /home/xueli/robustai/Attack_Scripts
          ```

      ### 3. 网络配置
      - **docker-compose.yml**:
        - 使用默认的 `app-network` 网络名称

      - **docker-compose(NRC).yml**:
        - 使用自定义的 `my-network-sxw` 网络名称
        - 更明确的网络隔离和命名

      ### 4. 服务依赖关系
      - **docker-compose.yml**:
        - 基本的服务依赖配置
        - 使用 `depends_on` 指定服务启动顺序

      - **docker-compose(NRC).yml**:
        - 更详细的服务依赖配置
        - 添加了健康检查条件
        - 例如：
          ```yaml
          depends_on:
            mysql:
              condition: service_healthy
            flaskend:
              condition: service_started
          ```

      ### 5. 环境变量配置
      - **docker-compose.yml**:
        - 基本的环境变量配置
        - 包含必要的数据库和路径配置

      - **docker-compose(NRC).yml**:
        - 更完整的环境变量配置
        - 添加了 `FLASK_DEBUG=1` 等开发调试配置
        - 更明确的路径配置

      ### 6. 版本号
      - **docker-compose.yml**:
        - 使用 `version: '3'`

      - **docker-compose(NRC).yml**:
        - 使用 `version: '3.8'`
        - 支持更多新特性

      ### 7. 容器命名
      - **docker-compose.yml**:
        - 使用默认的容器命名

      - **docker-compose(NRC).yml**:
        - 显式指定容器名称
        - 使用 `container_name` 确保容器名称固定

      ### 8. 健康检查配置
      - **docker-compose.yml**:
        - 基本的健康检查配置

      - **docker-compose(NRC).yml**:
        - 更详细的健康检查配置
        - 为 MySQL 服务添加了具体的健康检查参数

      ### 使用建议
      1. 在开发环境中使用 `docker-compose.yml`
      2. 在生产环境（如 NRC）中使用 `docker-compose(NRC).yml`
      3. 确保所有必要的目录在目标系统上存在
      4. 检查并设置正确的文件权限
      5. 确保网络配置符合目标环境的要求
（2）对于flaskend中的main.py 修改如下：
    app.run(host='0.0.0.0', port=5000, debug=True)  ##原为：：，因为在NRC dockers中运行显示不支持，所以改为0.0.0.0

（3）对于flaskend中的 container_scheduler3.py修改如下：
    # --- 硬编码主机路径 --- 
    logger.info("--- Using Hardcoded Host Paths --- ")
    #host_scripts_dir = "D:/Lee/robust-ai/Attack_Scripts" # 使用Windows路径格式
    #host_results_dir = "D:/Lee/robust-ai/Attack_Results"  # 使用Windows路径格式
    #host_models_dir = "D:/Lee/robust-ai/User_Models"    # 使用Windows路径格式
    host_scripts_dir = "/home/xueli/robustai/Attack_Scripts"  # Linux路径格式
    host_results_dir = "/home/xueli/robustai/Attack_Results"  # Linux路径格式
    host_models_dir = "/home/xueli/robustai/User_Models"     # Linux路径格式



    待改进的意见汇总：
    1 首页中NRC logo 增大一些； 已修改。
    2 Testbed 不要分开，放在一起; 已修改。
    3 在后端路由 /api/process 中，使用了 axios 实例发送请求到 Python 服务器，设置了 timeout: 60000000（原为600000=10分钟，现为1000分钟）。
    4 EAreport中最后红色已去除。