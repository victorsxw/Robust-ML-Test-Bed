# Robust-ML-Test-Bed
Task1+Task2+API(python)

20250116
updated V2.0

1 Three seperated pages.
2 Adding generating report function.

waiting for improving items:
1, adding "description" into report 1.
2, considering dataset and model file management.关于dataset的管理：准备一些预设的数据集（cifa10,cifa100, mint, ARP,）,供用户选择，如没有再上传。  关于文件命名，用户名+类型（model+data1+data2）+时间戳，要在用户名创建不重复。


当你将这些功能部署在 Docker 容器中时，需要注意以下几点：

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


注意事项：
1 关于多个dockers 多个images 的运行问题。前后端分开放在一个不同的容器中。
2 涉及BM级别的，与NRC沟通由薛老师统一沟通。
3 关于dataset的管理：准备一些预设的数据集（cifa10,cifa100, mint, ARP,）,供用户选择，如没有再上传。  关于文件命名，用户名+类型（model+data1+data2）+时间戳，要在用户名创建不重复。

2025-01-29
准备现有状态制作image放入NRC电脑运行试验。暂未成功。

2025-01-29
完成model，training dataset， test dataset文件上传至各自文件夹，命名为model/train_dataset/train_dataset-time stamps-原名字。


