---
title: 13-管理界面之Portainer
createTime: 2025/03/21 22:12:18
permalink: /docker/qu6ii93e/
---

Portainer 是一个轻量级的 Docker 管理工具，它提供了一个简单易用的 Web 界面，用于管理 Docker 环境。

以下是 Portainer 的一些主要特点和功能：

1. **用户友好的界面**：Portainer 提供了一个直观的 Web 界面，使用户可以通过图形化的方式来管理 Docker 容器、镜像、网络和卷。
2. **多环境支持**：除了 Docker 之外，Portainer 还支持 Docker Swarm 和 Kubernetes（通过 Portainer CE 和 Portainer BE）。这使得 Portainer 可以管理本地 Docker 环境、集群以及其他容器编排工具。
3. **容器管理**：你可以通过 Portainer 创建、启动、停止、重启和删除容器。同时，它还支持容器日志的查看和控制台的访问。
4. **镜像管理**：Portainer 允许用户查看本地镜像、从 Docker Hub 或其他注册表中拉取镜像，并能够创建和管理镜像的标签。
5. **网络和卷管理**：用户可以方便地创建和管理 Docker 网络和卷，配置容器的网络设置和存储方案。
6. **身份验证和授权**：Portainer 提供了基本的用户身份验证功能，并允许对用户角色和权限进行细粒度控制，确保管理权限的安全。
7. **Docker Compose 支持**：Portainer 支持 Docker Compose，可以通过界面管理和部署 Compose 文件。
8. **数据备份和恢复**：Portainer 提供了容器和环境数据的备份与恢复功能，帮助用户保护和迁移数据。

### 安装 Portainer

Portainer 的安装过程非常简单，你可以通过以下 Docker 命令快速部署：

```console
$ docker volume create portainer_data
$ docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce
```

这个命令会拉取 Portainer 的社区版镜像并运行它，`9000`​ 是 Portainer 的默认 Web 界面端口。

### 使用 Portainer

1. **访问 Portainer**：在浏览器中访问 `http://localhost:9000`​ 或 `http://<你的服务器IP>:9000`​。
2. **设置管理员账户**：首次访问时，你需要创建一个管理员账户来登录。
3. **连接 Docker 环境**：登录后，Portainer 会要求你连接到 Docker 环境。对于本地 Docker 环境，Portainer 会自动检测；对于远程 Docker 主机，你可以手动输入主机的 IP 和端口。
4. **开始管理**：登录后，你可以开始使用 Portainer 管理 Docker 容器、镜像、网络等。
