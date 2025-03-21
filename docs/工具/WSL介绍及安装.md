---
title: WSL介绍及安装
createTime: 2020/04/11 11:21:16
permalink: /article/a6rmi0bv/
tags:
  - Windows
category: 工具
---

**WSL**，全称**Windows Subsystem for Linux**，中文名为 **适用于 Linux 的 Windows 子系统**，WSL可让开发人员按原样运行 GNU/Linux 环境 - 包括大多数命令行工具、实用工具和应用程序 - 且不会产生传统虚拟机或双启动设置开销。

在WSL中可以做以下工作：

- 在 Microsoft Store 中选择你偏好的 GNU/Linux 分发版。
- 运行常用的命令行软件工具（例如 grep、sed、awk）或其他 ELF-64 二进制文件。
- 运行 Bash shell 脚本和 GNU/Linux 命令行应用程序，包括：
- 工具：vim、emacs、tmux 等。
- 语言：NodeJS、Javascript、Python、Ruby、C/ C++、C# 与 F#、Rust、Go 等。
- 服务：SSHD、MySQL、Apache、lighttpd、MongoDB、PostgreSQL。
- 使用自己的 GNU/Linux 分发包管理器安装其他软件。
- 使用类似于 Unix 的命令行 shell 调用 Windows 应用程序。
- 在 Windows 上调用 GNU/Linux 应用程序。

## WSL2简介

WSL 2 是适用于 Linux 的 Windows 子系统体系结构的一个新版本，它支持适用于 Linux 的 Windows 子系统在 Windows 上运行 ELF64 Linux 二进制文件。 它的主要目标是**提高文件系统性能**，以及添加**完全的系统调用兼容性**。

这一新的体系结构改变了这些 Linux 二进制文件与Windows 和计算机硬件进行交互的方式，但仍然提供与 WSL 1（当前广泛可用的版本）中相同的用户体验。

单个 Linux 分发版可以在 WSL 1 或 WSL 2 体系结构中运行。 每个分发版可随时升级或降级，并且你可以并行运行 WSL 1 和 WSL 2 分发版。 WSL 2 使用全新的体系结构，该体系结构受益于运行真正的 Linux 内核。

## 安装WSL2

[官方文档: 安装教程](https://learn.microsoft.com/zh-cn/windows/wsl/install)。

WSL2 仅在 Windows 10 18917 或更高版本中可用，如果版本太低，可以加入 Windows Insider 升级 Windows ，我们可以在 cmd 中使用 ver 来检查当前 win的版本。

```cmd
C:\Users\xxx>ver

Microsoft Windows [版本 10.0.22621.1105]
```

或者使用命令 `winver` 查看

### 安装WSL

在 powerShell 中以管理员身份运行下面命令：

```shell
wsl --install
```

### 设置 WSL 发行版

如果想要将默认的WSL发行版设置成 WSL2，在 powerShell 中使用下面命令

```shell
wsl --set-default-version 2
```

如果想要设置某一个发行版为WSL2，在 powerShell 中使用下面命令，将  换成你想要设置的发行版即可，例如 Ubuntu-18.04

```shell
wsl --set-version <Distro> 2
```

验证使用的WSL版本

```shell
wsl -l -v
```

安装WSL2的详细步骤可以参考官方文档：[WSL 2 的安装说明](https://docs.microsoft.com/zh-cn/windows/wsl/wsl2-install)

## WSL命令行工具

WSL所有支持的命令如下：

```shell
C:\WINDOWS\system32>wsl --help
版权所有 (c) Microsoft Corporation。保留所有权利。

用法: wsl.exe [参数] [选项...] [命令行]

用于运行 Linux 二进制文件的参数:

    如果未提供命令行，wsl.exe 将启动默认的 shell。

    --exec, -e <命令行>
        执行指定的命令而不使用默认的 Linux shell。

    --
        按原样传递剩余的命令行。

选项:
    --distribution, -d <分发版>
        运行指定的分发。

    --user, -u <用户名>
        以指定用户身份运行。

用于管理适用于 Linux 的 Windows 子系统的参数:

    --export <分发版> <文件名>
        将分发导出到 tar 文件。
        对于标准输出，文件名可以是 -。

    --import <分发版> <安装位置> <文件名> [选项]
        将指定的 tar 文件作为新分发进行导入。
        对于标准输入，文件名可以是 -。

        选项:
            --version <版本>
                指定用于新分发的版本。

    --list, -l [选项]
        列出分发。

        选项:
            --all
                列出所有分发，包括当前正在
                安装或卸载的分发。

            --running
                只列出当前正在运行的分发。

            --quiet, -q
                只显示分发名称。

            --verbose, -v
                显示有关所有分发的详细信息。

    --set-default, -s <分发版>
        将分发设置为默认值。

    --set-default-version <版本>
        更改新分发的默认安装版本。

    --set-version <分发版> <版本>
        更改指定分发的版本。

    --shutdown
        立即终止所有正在运行的分发和 WSL 2 轻型工具虚拟机。

    --terminate, -t <分发版>
        终止指定的分发。

    --unregister <分发版>
        注销分发。

    --help
        显示用法信息。
```

wslconfig所有支持的命令如下：

```shell
C:\WINDOWS\system32>wslconfig
在适用于 Linux 的 Windows 子系统上执行管理操作

用法:
    /l, /list [Option]
        列出已注册的分发。
        /all - 可选择列出所有分发，包括当前正在
               安装或卸载的分发。

        /running - 只列出当前正在运行的分发。

    /s, /setdefault <DistributionName>
        将分发设置为默认值。

    /t, /terminate <DistributionName>
        终止分发。

    /u, /unregister <DistributionName>
        注销分发。
```

### 查看WSL列表

格式：

```shell
# 列出已注册分发
wsl -l, --list
wslconfig /l, /list

# 列出所有分发，包括当前正在安装或卸载的分发
wslconfig /l /all
wsl -l --all

# 仅列出当前正在运行的分发
wslconfig /l /running
wsl -l --running

# 查看列表及其WSL版本
wsl -l -v
```

示例1：

```shell
C:\Users\xxx>wslconfig /l
适用于 Linux 的 Windows 子系统分发版:
CentOS7 (默认)
docker-desktop-data
docker-desktop
Ubuntu22.04
```

示例2：

```shell
C:\Users\xxx>wsl -l -v
  NAME                   STATE           VERSION
* CentOS7                Stopped         1
  docker-desktop-data    Stopped         2
  docker-desktop         Stopped         2
  Ubuntu22.04            Running         2
```

### 进入指定的WSL

格式：

```shell
wsl, bash # 进入默认WSL环境
wsl --distribution, -d <DistributionName> # 运行指定的分发
wsl --user, -u <UserName> # 以指定用户身份运行
```

示例：

```shell
wsl
bash
wsl -d Ubuntu22.04
wsl -d Ubuntu22.04 -u root
```

进入WSL后，使用 `exit` 命令退出WSL。

### 查看可在线安装的wsl

```shell
❯ wsl --list --online
以下是可安装的有效分发的列表。
使用‘wsl.exe --install <Distro>'安装。

NAME               FRIENDLY NAME
Ubuntu             Ubuntu
Debian             Debian GNU/Linux
kali-linux         Kali Linux Rolling
SLES-12            SUSE Linux Enterprise Server v12
SLES-15            SUSE Linux Enterprise Server v15
Ubuntu-18.04       Ubuntu 18.04 LTS
Ubuntu-20.04       Ubuntu 20.04 LTS
OracleLinux_8_5    Oracle Linux 8.5
OracleLinux_7_9    Oracle Linux 7.9
```

### 卸载指定的WSL

格式：

```shell
# 注销分发
wslconfig  /u, /unregister <DistributionName>
wsl --unregister <DistributionName>
```

示例：

```shell
wslconfig /u Ubuntu22.04
wsl --unregister Ubuntu22.04
```

### 将分发设置为默认值

格式：

```shell
wsl -setdefault, -s <DistributionName>
wslconfig /s, /setdefault <DistributionName>
```

将默认版本设置为WSL2：

```shell
wsl --set-default-version 2
```

将指定分发设置为默认版本：

```shell
wsl -s Ubuntu22.04
```

将指定分发设置为WSL2：

```shell
wsl --set-version Ubuntu22.04 2
```

如果在设置分支的时候报以下错误：

```
WSL 2 需要更新其内核组件。有关信息，请访问 https://aka.ms/wsl2kernel
```

可以到下面链接下载内核更新包安装即可成功升级：[更新 WSL 2 Linux 内核](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)

### 查看状态

```shell
PS C:\Users\xxx> wsl --status
默认分发：CentOS7
默认版本：2

适用于 Linux 的 Windows 子系统最后更新于 2023/2/12
适用于 Linux 的 Windows 子系统内核可以使用“wsl --update”手动更新，但由于你的系统设置，无法进行自动更新。
 若要接收自动内核更新，请启用 Windows 更新设置:“在更新 Windows 时接收其他 Microsoft 产品的更新”。
 有关详细信息，请访问https://aka.ms/wsl2kernel。
Windows 更新已暂停。

内核版本： 5.10.16
```

### 升级版本

```shell
PS C:\Users\xxx> wsl --update                           ]
正在安装: 适用于 Linux 的 Windows 子系统
已安装 适用于 Linux 的 Windows 子系统。
```

### 导出镜像

比如我们需要导出Ubuntu22.04：

```shell
wsl --export Ubuntu22.04 D:\linux\Ubuntu22.04.tar
```

指定要导出的子系统名称，并指定导出路径即可。

### 导入镜像

找到刚才导出的镜像，执行以下命令即可导入进行：

```shell
wsl --import Ubuntu22.04 D:\linux\Ubuntu22.04 D:\linux\Ubuntu22.04.tar
```
