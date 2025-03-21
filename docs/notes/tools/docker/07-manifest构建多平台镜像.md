---
title: 07-manifest构建多平台镜像
createTime: 2025/03/21 22:12:18
permalink: /docker/8tb1dk1r/
---

在当今的软件开发领域中，构建跨平台应用程序已经成为了一个普遍存在的需求。不同的操作系统、硬件架构需要不同的镜像环境来支持它们。Docker 作为一个广泛应用的容器化技术，必然需要能够支持构建跨平台镜像，本文将介绍如何使用 `docker manifest`​ 来实现构建跨平台镜像。

### 简介

​`docker manifest`​ 是 Docker 的一个命令，它提供了一种方便的方式来管理不同操作系统和硬件架构的 Docker 镜像。

通过 `docker manifest`​，用户可以创建一个虚拟的 Docker 镜像，其中包含了多个实际的 Docker 镜像，每个实际的 Docker 镜像对应一个不同的操作系统和硬件架构。

​`docker manifest`​ 命令本身并不执行任何操作。

​`manifest`​ 可以理解为是一个 JSON 文件，单个 `manifest`​ 包含有关镜像的信息，例如层（layers）、大小（size）和摘要（digest）等。

​`manifest list`​ 是通过指定一个或多个（理想情况下是多个）镜像名称创建的镜像列表（即上面所说的虚拟 Docker 镜像）。

可以像普通镜像一样使用 `docker pull`​ 和 `docker run`​ 等命令来操作它。

### 准备工作

工欲善其事，必先利其器，如果想使用 `docker manifest`​ 构建多架构镜像，需要具备以下条件。

* 机器上安装了 Docker。
* 需要注册一个 [Docker Hub](https://hub.docker.com/) 账号。
* 联网，`docker manifest`​ 命令是需要联网使用的。

### 为不同平台构建镜像

本文中演示程序所使用的环境是 amd64平台的Ubuntu22.04。本地的 Docker 版本如下：

```shell
❯ docker info
Client:
 Version:    26.1.3
 Context:    default
 Debug Mode: false

Server:
 Server Version: 26.1.3
 Runtimes: runc io.containerd.runc.v2
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 926c9586fe4a6236699318391cd44976a98e31f1
 runc version: v1.1.12-0-g51d5e94
 init version: de40ad0
 Kernel Version: 5.15.153.1-microsoft-standard-WSL2
 Operating System: Ubuntu 22.04.3 LTS
 OSType: linux
 Architecture: x86_64
 CPUs: 16
 Total Memory: 7.619GiB
 Product License: Community Engine
```

#### 准备 Dockerfile

首先准备如下 Dockerfile 文件，用来构建镜像。

```dockerfile
FROM alpine:latest
RUN uname -a > /os.txt
CMD cat /os.txt
```

这个镜像非常简单，构建时将 `uname -a`​ 命令输出信息（即当前操作系统的相关信息）写入 `/os.txt`​，运行时将 `/os.txt`​ 内容输出。

#### 构建 AMD64 平台镜像

因为本机为 AMD架构的机器，所以使用 `docker build`​ 命令构建镜像默认为 `amd64`​ 平台镜像，此时`--platform=linux/amd64`​参数可以不加，默认也是构建AMD64镜像。

```shell
❯ docker build --no-cache --platform=linux/amd64 -t bookadmusic/echo-platform-amd64:20240716 .
[+] Building 9.9s (6/6) FINISHED                                                                                                                                                                   docker:default
 => [internal] load build definition from Dockerfile                                                                                                                                                         0.2s
 => => transferring dockerfile: 88B                                                                                                                                                                          0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                                                                                                                                             3.5s
 => [internal] load .dockerignore                                                                                                                                                                            0.3s
 => => transferring context: 2B                                                                                                                                                                              0.0s
 => CACHED [1/2] FROM docker.io/library/ubuntu:latest@sha256:2e863c44b718727c860746568e1d54afd13b2fa71b160f5cd9058fc436217b30                                                                                0.0s
 => [2/2] RUN uname -a > /os.txt                                                                                                                                                                             2.8s
 => exporting to image                                                                                                                                                                                       1.6s
 => => exporting layers                                                                                                                                                                                      1.1s
 => => writing image sha256:e5c7f51c568dbda345856ed49a2dc9f7c31464a474292ccd4df05d76f5d45fd4                                                                                                                 0.1s
 => => naming to docker.io/library/bookadmusic/echo-platform-amd64:20240716 
```

注意：`bookadmusic`​ 是 Docker Hub 用户名，之后需要将镜像推送到远程仓库，方便最后构建多架构镜像。

如果得到如上类似输出，表明构建成功。

使用 `docker run`​ 运行容器进行测试：

```shell
❯ docker run --platform=linux/amd64 --rm bookadmusic/echo-platform-amd64:20240716
Linux buildkitsandbox 5.15.153.1-microsoft-standard-WSL2 #1 SMP Fri Mar 29 23:14:13 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

输出内容中的 `x86_64 `​ 就表示 `AMD64`​ 架构。

现在我们需要将镜像推送到 Docker Hub，确保在命令行中已经使用 `docker login`​ 登录过 Docker Hub

```shell
❯ docker login
Authenticating with existing credentials...
WARNING! Your password will be stored unencrypted in ~/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
```

使用 `docker push`​ 命令推送镜像：

```shell
❯ docker push bookadmusic/echo-platform-amd64:20240716
The push refers to repository [docker.io/bookadmusic/echo-platform-amd64]
54c138956663: Pushed
a30a5965a4f7: Mounted from library/ubuntu
20240716: digest: sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8 size: 736
```

使用docker search 可以搜到推送的镜像

```shell
❯ docker search bookadmusic
NAME                              DESCRIPTION   STARS     OFFICIAL
bookadmusic/echo-platform-amd64                 0
```

#### 构建 ARM64 平台镜像

无需切换设备，在 AMD机器上也可以直接构建 `arm64`​镜像，`docker build`​ 命令提供了 `--platform`​ 参数可以构建跨平台镜像。

前提是在 Docker 中安装并启用 `binfmt_misc`​，以便支持多架构的二进制文件格式。

```shell
docker run --privileged --rm tonistiigi/binfmt --install all
```

构建arm64的镜像，此时`--platform=linux/arm64`​参数必须存在，指定构建的镜像为ARM镜像。

```shell
❯ docker build --no-cache --platform=linux/arm64 -t bookadmusic/echo-platform-arm64:20240716 .
[+] Building 8.7s (6/6) FINISHED                                                                                                                                                                   docker:default
 => [internal] load build definition from Dockerfile                                                                                                                                                         0.5s
 => => transferring dockerfile: 88B                                                                                                                                                                          0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                                                                                                                                             2.0s
 => [internal] load .dockerignore                                                                                                                                                                            0.2s
 => => transferring context: 2B                                                                                                                                                                              0.0s
 => CACHED [1/2] FROM docker.io/library/ubuntu:latest@sha256:2e863c44b718727c860746568e1d54afd13b2fa71b160f5cd9058fc436217b30                                                                                0.0s
 => [2/2] RUN uname -a > /os.txt                                                                                                                                                                             2.6s
 => exporting to image                                                                                                                                                                                       1.3s
 => => exporting layers                                                                                                                                                                                      0.8s
 => => writing image sha256:8aadc4dd7bb485fd4e870f10cc00b0311707560395e2bfffe629d3ec3e925a8a                                                                                                                 0.1s
 => => naming to docker.io/library/bookadmusic/echo-platform-arm64:20240716   
```

镜像构建成功后，同样使用 `docker push`​ 命令推送镜像到 Docker Hub：

```shell
❯ docker push bookadmusic/echo-platform-arm64:20240716
The push refers to repository [docker.io/bookadmusic/echo-platform-arm64]
3de1dbefe9e9: Pushed
aac3af10edc6: Mounted from library/ubuntu
20240716: digest: sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9 size: 736
```

同样可以搜索到刚推送的镜像

```shell
❯ docker search bookadmusic
NAME                              DESCRIPTION   STARS     OFFICIAL
bookadmusic/echo-platform-arm64                 0
bookadmusic/echo-platform-amd64                 0
```

当然，也可以在amd机器上运行该镜像：

```
❯ docker run --platform=linux/arm64 --rm bookadmusic/echo-platform-arm64:20240716
Linux buildkitsandbox 5.15.153.1-microsoft-standard-WSL2 #1 SMP Fri Mar 29 23:14:13 UTC 2024 aarch64 aarch64 aarch64 GNU/Linux
```

### 使用 manifest 合并多平台镜像

我们可以使用 `docker manifest`​ 的子命令 `create`​ 创建一个 `manifest list`​，即将多个平台的镜像合并为一个镜像。

> **注意**：在使用 `docker manifest create`​ 命令时，确保待合并镜像都已经被推送到 Docker Hub 镜像仓库，不然报错 `no such manifest`​。这也是为什么前文在构建镜像时，都会将镜像推送到 Docker Hub。

​`create`​ 命令用法很简单，后面跟的第一个参数 `bookadmusic/echo-platform-amd64:20240716`​ 即为合并后的镜像，从第二个参数开始可以指定一个或多个不同平台的镜像。

```
❯ docker manifest create bookadmusic/echo-platform:20240716 bookadmusic/echo-platform-amd64:20240716 bookadmusic/echo-platform-arm64:20240716
Created manifest list docker.io/bookadmusic/echo-platform:20240716
```

如上输出，表明多架构镜像构建成功。

此时本地通过 `docker images`​命令是找不到镜像的，因为本地机器是AMD64不支持多架构镜像。需要将镜像推送到远程仓库。

不过，这回我们需要使用的命令不再是 `docker push`​ 而是 `manifest`​ 的子命令 `docker manifest push`​：

```shell
❯ docker manifest push bookadmusic/echo-platform:20240716
Pushed ref docker.io/bookadmusic/echo-platform@sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8 with digest: sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8
Pushed ref docker.io/bookadmusic/echo-platform@sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9 with digest: sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9
sha256:63b90019889350d0ffd1cf8ae11e964ace47fdfb75ba1fac081d3209d6600dbf
```

使用`docker search`​ 可以看到目前推送的三个镜像：

```shell
❯ docker search bookadmusic
NAME                              DESCRIPTION   STARS     OFFICIAL
bookadmusic/echo-platform-amd64                 0
bookadmusic/echo-platform                       0
bookadmusic/echo-platform-arm64                 0
```

### manifest 功能清单

​`docker manifest`​ 不止有 `create`​ 一个子命令，可以通过 `--help`​ 参数查看使用帮助：

```shell
$ docker manifest --help

Usage:  docker manifest COMMAND

The **docker manifest** command has subcommands for managing image manifests and
manifest lists. A manifest list allows you to use one name to refer to the same image
built for multiple architectures.

To see help for a subcommand, use:

    docker manifest CMD --help

For full details on using docker manifest lists, see the registry v2 specification.

EXPERIMENTAL:
  docker manifest is an experimental feature.
  Experimental features provide early access to product functionality. These
  features may change between releases without warning, or can be removed from a
  future release. Learn more about experimental features in our documentation:
  https://docs.docker.com/go/experimental/

Commands:
  annotate    Add additional information to a local image manifest
  create      Create a local manifest list for annotating and pushing to a registry
  inspect     Display an image manifest, or manifest list
  push        Push a manifest list to a repository
  rm          Delete one or more manifest lists from local storage

Run 'docker manifest COMMAND --help' for more information on a command.
```

可以发现，`docker manifest`​ 共提供了 `annotate`​、`create`​、`inspect`​、`push`​、`rm`​ 这 5 个子命令。

详细信息也可以使用`docker manifest command --help`​查看子命令的参数及具体用法。

接下来我们分别看下这几个子命令的功能。

#### create

​`create`​ 子命令支持两个可选参数：

* `-a/--amend`​ 用来修订已存在的多架构镜像。
* `--insecure`​ 参数则允许使用不安全的（非 https）镜像仓库。

#### push

​`push`​ 子命令我们也见过了，使用 `push`​ 可以将多架构镜像推送到镜像仓库。

来看下 `push`​ 还支持设置哪些可选参数。

* `--insecure`​ 参数允许使用不安全的（非 https）镜像仓库。
* `-p/--purge`​ 选项的作用是推送本地镜像到远程仓库后，删除本地 `manifest list`​。

#### inspect

​`inspect`​ 用来查看 `manifest`​/`manifest list`​ 所包含的镜像信息。

* `--insecure`​ 参数允许使用不安全的（非 https）镜像仓库。这已经是我们第三次看见这个参数了，这也验证了 `docker manifest`​ 命令需要联网才能使用的说法，因为这些子命令基本都涉及到和远程镜像仓库的交互。
* `-v/--verbose`​ 参数可以输出更多信息，包括镜像的 `layers`​ 和 `platform`​ 信息。

使用示例如下：

```shell
❯ docker manifest inspect bookadmusic/echo-platform:20240716
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
   "manifests": [
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8",
         "platform": {
            "architecture": "amd64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9",
         "platform": {
            "architecture": "arm64",
            "os": "linux"
         }
      }
   ]
}
```

从输出信息中可以发现，我们构建的多架构镜像 `bookadmusic/echo-platform`​ 包含两个 `manifest`​，可以支持 `amd64`​/`arm64`​ 架构，并且都为 `linux`​ 系统下的镜像。

#### annotate

​`annotate`​ 子命令可以给一个本地镜像 `manifest`​ 添加附加的信息。

可选参数列表如下：

* ​`--arch string`​：设置 CPU 架构信息。
* ​`--os string`​：设置操作系统信息。
* ​`--os-features strings`​：设置操作系统功能信息。
* ​`--os-version string`​：设置操作系统版本信息。
* ​`--variant string`​：设置 CPU 架构的 variant 信息（翻译过来是 “变种” 的意思），如 ARM 架构的 v7、v8 等。

例如设置操作系统版本信息，可以使用如下命令：

```shell
❯ docker manifest annotate --os-version ubuntu22.04 bookadmusic/echo-platform:20240716 bookadmusic/echo-platform-amd64:20240716
```

现在使用 `inspect`​ 查看镜像信息已经发生变化：

```shell
❯ docker manifest inspect bookadmusic/echo-platform:20240716
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
   "manifests": [
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8",
         "platform": {
            "architecture": "amd64",
            "os": "linux",
            "os.version": "ubuntu22.04"
         }
      },
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9",
         "platform": {
            "architecture": "arm64",
            "os": "linux"
         }
      }
   ]
}
```

#### rm

最后要介绍的子命令是 `rm`​，使用 `rm`​ 可以删除本地一个或多个多架构镜像（`manifest lists`​）。

使用示例如下：

```shell
❯ docker manifest rm bookadmusic/echo-platform:20240716
```

现在使用 `inspect`​ 查看镜像信息已经不在有 `os.version`​ 信息了，因为本地镜像 `manifest lists`​ 信息已经被删除，重新从远程镜像仓库拉下来的多架构镜像信息并不包含 `os.version`​。

```
❯ docker manifest inspect bookadmusic/echo-platform:20240716
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
   "manifests": [
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:3ed09a194506854059e5eba2daded2c512b61dc467b29195b6178eaa3bc3f3e8",
         "platform": {
            "architecture": "amd64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
         "size": 736,
         "digest": "sha256:241e8908a9f3a622375c4eba19598e3a0a21ce4e56e2db223a16853ba6250bb9",
         "platform": {
            "architecture": "arm64",
            "os": "linux"
         }
      }
   ]
}
```

### **参考**

docker manifest 官方文档：[https://docs.docker.com/engine/reference/commandline/manifest/](https://docs.docker.com/engine/reference/commandline/manifest/)
