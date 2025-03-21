---
title: 03-supervisor
createTime: 2025/03/21 22:12:18
permalink: /linux/service/n9rzt1b5/
---
## 工具介绍

Supervisor 是一个基于 Python 的进程管理工具，广泛用于管理和控制 Linux 或 Unix 系统中的服务。它可以帮助用户轻松启动、停止、重启和监控多个服务或进程，并在进程异常退出时自动重启。Supervisor 的主要优势在于它的简单配置、高可用性和强大的日志管理功能，非常适合应用于开发、测试和生产环境中的多进程管理需求。

**Supervisor的核心功能**：

* **进程管理**：启动、停止、重启和监控多个进程。
* **自动重启**：在服务崩溃或意外退出时自动重启服务。
* **日志管理**：提供日志收集和查看功能，便于调试和监控。
* **Web 界面**：可通过 Web UI 管理和查看所有被监控的进程。
* **进程组管理**：支持批量管理一组相关的服务。

## 工具安装

在 Linux 系统中，安装 Supervisor 非常简单，通常通过包管理器来完成。

```bash
# ubuntu
sudo apt update
sudo apt install supervisor
# centos
sudo yum install epel-release
sudo yum install supervisor
```

安装后，启用并启动服务：

```bash
sudo systemctl enable supervisord
sudo systemctl start supervisord
sudo systemctl status supervisor
```

## 管理服务

安装完 Supervisor 后，通常需要为每个要管理的服务编写配置文件。默认情况下，Supervisor 的主配置文件位于 `/etc/supervisor/supervisord.conf`​。

### 添加服务配置

在 `/etc/supervisor/conf.d/`​ 目录中为每个服务创建单独的配置文件。例如，我们想要管理一个名为 `myapp`​ 的应用，可以创建一个名为 `myapp.conf`​ 的文件：

```ini
[program:myapp]
command=/usr/bin/python3 /path/to/app.py    ; 启动命令
autostart=true                              ; Supervisor 启动时自动启动该服务
autorestart=true                            ; 服务退出后自动重启
stderr_logfile=/var/log/myapp.err.log       ; 错误日志路径
stdout_logfile=/var/log/myapp.out.log       ; 输出日志路径
```

### 加载配置文件

当新的服务配置文件添加后，需要重新加载 Supervisor 配置，并启动该服务：

```bash
sudo supervisorctl reread        # 重新读取配置
sudo supervisorctl update        # 更新 Supervisor 以应用新配置
sudo supervisorctl start myapp   # 启动服务
```

### 常用管理命令

Supervisor 提供了 `supervisorctl`​ 工具来管理和监控服务，常见的命令如下：

```bash
# 启动、停止、重启服务
sudo supervisorctl start myapp
sudo supervisorctl stop myapp
sudo supervisorctl restart myapp

# 查看服务状态
sudo supervisorctl status

# 重启所有服务
sudo supervisorctl restart all
```

### 日志查看

Supervisor 默认将每个服务的日志存储在配置文件中指定的位置，用户可以直接查看日志文件，也可以通过以下命令查看

```bash
sudo supervisorctl tail -f myapp
```

## Web 界面

Supervisor 提供了一个简洁的 Web 界面，可以通过修改配置文件来启用。首先，编辑主配置文件 `/etc/supervisor/supervisord.conf`​，找到 `[inet_http_server]`​ 部分，并修改为：

```ini
[inet_http_server]
port=*:9001         ; Web 界面的端口号
username=user       ; 登录用户名
password=pass       ; 登录密码
```

保存后，重启 Supervisor 服务：

```bash
sudo systemctl restart supervisor
```

然后，打开浏览器访问 `http://<your_server_ip>:9001`​，使用配置的用户名和密码登录，即可通过 Web 界面管理服务。

## 总结

Supervisor 是一个非常强大的进程管理工具，能够帮助开发人员和系统管理员轻松地管理多个后台服务。它提供了自动重启、日志管理、Web 界面等功能，简化了服务的监控与维护。在生产环境中，通过 Supervisor 可以有效提升服务的稳定性和可维护性。

## 参考资料

* [Supervisor 官方文档](http://supervisord.org/)
