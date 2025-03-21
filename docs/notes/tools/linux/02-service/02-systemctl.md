---
title: 02-systemctl
createTime: 2025/03/21 22:12:18
permalink: /linux/service/b2llluma/
---
## `systemctl`​ 介绍

​`systemctl`​ 是 Linux 系统中用于控制 `systemd`​ 服务管理器的命令行工具。`systemd`​ 是现代 Linux 系统中的初始化系统和服务管理框架，取代了传统的 `SysVinit`​。它能够并行启动服务、管理依赖关系、自动处理故障恢复、监控系统状态等，极大地提升了系统启动速度和服务管理能力。

**​**​**​`systemd`​**​**​** **的核心功能：**

* 启动和管理服务：使用 `.service`​ 文件定义和管理系统服务。
* 依赖关系管理：自动解析服务之间的依赖关系，并按顺序启动/停止。
* 资源控制：通过 `cgroups`​ 限制服务的 CPU、内存等资源使用。
* 日志管理：集成了 `journalctl`​ 日志系统，方便查看和分析服务运行日志。
* 并行启动：通过并行化进程管理，优化了启动时间。

## Service 文件

在 `systemd`​ 中，服务的定义和管理依赖于 `.service`​ 文件，它们通常位于 `/etc/systemd/system/`​ 或 `/lib/systemd/system/`​ 目录下。每个 `.service`​ 文件定义了一个服务的启动、停止、重启、依赖关系等信息。

### ​`.service`​ 文件结构

一个典型的 `.service`​ 文件分为三个主要部分：`[Unit]`​、`[Service]`​ 和 `[Install]`​。

```ini
[Unit]
Description=My Custom Service        # 服务的描述
After=network.target                 # 服务的启动顺序，表示在网络服务启动后启动

[Service]
Type=simple                          # 服务类型，simple 表示启动命令不会 fork 进程
ExecStart=/usr/bin/myapp --flag      # 服务启动时执行的命令
Restart=on-failure                   # 当服务失败时自动重启
RestartSec=5                         # 重启延迟时间（秒）
User=appuser                         # 运行该服务的用户

[Install]
WantedBy=multi-user.target            # 服务在哪个目标环境下启用，multi-user.target 表示多用户模式
```

### 常见的服务类型

* ​`simple`​：默认值，服务启动后 `ExecStart`​ 指定的进程不会再 fork。
* ​`forking`​：服务启动后，`ExecStart`​ 指定的进程会 fork，并且父进程会退出，服务作为后台进程运行。
* ​`oneshot`​：一次性任务服务，服务会执行完毕并退出，而不是持续运行。
* ​`notify`​：服务启动后会向 `systemd`​ 发送通知，告知其已准备好。
* ​`idle`​：服务的启动被延迟到所有其他作业完成后。

### 管理自定义应用

假设我们有一个 Python 应用 `myapp.py`​ 需要使用 `systemd`​ 进行管理，可以创建以下 `.service`​ 文件：

```ini
[Unit]
Description=My Python Application
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /path/to/myapp.py
Restart=on-failure
RestartSec=10
User=appuser

[Install]
WantedBy=multi-user.target
```

保存为 `/etc/systemd/system/myapp.service`​，然后执行以下命令让 `systemd`​ 识别并加载这个新服务：

```bash
sudo systemctl daemon-reload      # 重新加载 systemd 配置
sudo systemctl enable myapp       # 启用服务
sudo systemctl start myapp        # 启动服务
```

## ​`systemctl`​ 常用命令

​`systemctl`​ 命令用于管理和控制 `systemd`​ 服务。以下是一些常见的操作命令。

### 服务管理

```bash
# 启动服务
sudo systemctl start <service_name>

# 停止服务
sudo systemctl stop <service_name>

# 重启服务
sudo systemctl restart <service_name>

# 重载服务（不会停止服务，仅重新加载配置）
sudo systemctl reload <service_name>

# 查看服务状态
sudo systemctl status <service_name>
```

### 服务启用与禁用

```bash
# 设置服务开机自启
sudo systemctl enable <service_name>

# 取消服务开机自启
sudo systemctl disable <service_name>

# 开机时自动重启服务
sudo systemctl enable --now <service_name>

# 临时阻止服务启动
sudo systemctl mask <service_name>

# 取消屏蔽服务
sudo systemctl unmask <service_name>
```

### 查看和控制服务日志

​`systemd`​ 集成了日志管理工具 `journalctl`​，可以用于查看服务的详细日志。

```bash
# 查看当前服务的日志
sudo journalctl -u <service_name>

# 查看最近的服务日志
sudo journalctl -u <service_name> --since "10 minutes ago"

# 实时跟踪日志输出
sudo journalctl -u <service_name> -f
```

### ​`systemctl`​ 目标管理

​`systemd`​ 中的“目标”（target）类似于旧的 `runlevel`​ 概念，用于定义系统当前的运行状态。例如，`multi-user.target`​ 是普通的多用户模式，而 `graphical.target`​ 是图形化模式。

```bash
# 切换到多用户模式
sudo systemctl isolate multi-user.target

# 切换到图形化模式
sudo systemctl isolate graphical.target

# 查看当前运行的 target
systemctl get-default

# 设置默认的 target
sudo systemctl set-default multi-user.target
```

## 总结

​`systemctl`​ 是 Linux 系统中管理服务的核心工具，通过 `.service`​ 文件，我们可以灵活控制服务的启动和停止，同时设置服务的依赖关系、自动重启策略等。通过常用的 `systemctl`​ 命令，管理员可以轻松管理系统服务的状态、配置自启动和查看日志。结合 `systemd`​ 的高效资源控制和日志集成功能，它成为了现代 Linux 系统中不可或缺的管理工具。

‍
