---
title: 02-部署集群之Minikube
createTime: 2025/03/21 22:12:18
permalink: /kubernetes/e9bh1bg4/
---

> minikube 是本地 Kubernetes，专注于简化 Kubernetes 的学习和开发。

你只需要 Docker（或类似的兼容）容器或虚拟机环境，Kubernetes 只需一条命令即可：`minikube start`​

## minikube安装

### 下载二进制文件

* Linux

  ```bash
  curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  ```
* Mac (Intel芯片)

  ```bash
  curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
  ```
* Mac (Apple Silicon芯片)

  ```bash
  curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-arm64
  ```
* Windows

  通过命令行下载并重命名

  ```bash
  curl -Lo minikube.exe https://github.com/kubernetes/minikube/releases/latest/download/minikube-windows-amd64.exe
  ```

### 安装Minikube

* Linux 和 Mac

  ```bash
  sudo install minikube /usr/local/bin/
  ```
* Windows

  将下载的`minikube.exe`​移动到系统路径，例如`C:\Windows\System32`​，或者添加其所在目录到系统的`PATH`​环境变量中。

### 验证安装

打开终端窗口，输入：

```bash
minikube version
```

成功显示版本信息即表示安装完成。

## 启动集群

minikube支持[各种驱动程序](https://minikube.kubernetes.ac.cn/docs/drivers/)，以下是基于Docker驱动**本地化**部署k8s集群：

* 安装 Docker 18.09 或更高版本（建议使用 20.10 或更高版本）
* amd64 或 arm64 系统。

```bash
minikube start --image-mirror-country='cn' --image-repository='registry.cn-hangzhou.aliyuncs.com/google_containers' --registry-mirror='https://dockerpull.com' --driver=docker --base-image='registry.cn-hangzhou.aliyuncs.com/google_containers/kicbase:v0.0.44'
```

## 管理集群

kubectl 是 Kubernetes 自带的客户端，可以用它来直接操作 Kubernetes 集群。

### 配置文件

* kubectl默认使用`~/.kube/config`​配置文件，minikube会自动初始化配置文件
* 也可以使用环境变量的方式，指明配置文件位置：`export KUBECONFIG=/pth/to/admin.conf`​

### 操作方式

minikube搭建的集群，可以直接使用 `minikube kubectl -- command`​,`command`​就是正常的kubectl命令

```console
$ minikube kubectl get ns
NAME              STATUS   AGE
default           Active   12m
kube-node-lease   Active   12m
kube-public       Active   12m
kube-system       Active   12m
```

或者直接在宿主机上安装kubectl，然后操作集群

```console
$ curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   138  100   138    0     0    264      0 --:--:-- --:--:-- --:--:--   264
100 49.0M  100 49.0M    0     0  1780k      0  0:00:28  0:00:28 --:--:-- 1863k

~ took 32s 
$ sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

$ kubectl get ns   
NAME              STATUS   AGE
default           Active   4m52s
kube-node-lease   Active   4m52s
kube-public       Active   4m52s
kube-system       Active   4m53s
```

‍
