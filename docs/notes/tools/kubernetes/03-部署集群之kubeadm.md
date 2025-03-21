---
title: 03-部署集群之kubeadm
createTime: 2025/03/21 22:12:18
permalink: /kubernetes/266cxdig/
---

> 使用kubeadm基于`containerd`​作为容器运行时，初始化k8s集群

## 环境初始化

### 修改内核参数

加载必要的内核模块并配置`sysctl`​参数。

```bash
# 加载 overlay 和 br_netfilter 模块
cat <<EOF | tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# 配置 sysctl 参数
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# 使 sysctl 配置生效
sysctl --system
```

### ​容器运行时

#### 安装`containerd`​

根据操作系统（CentOS或Ubuntu）安装`containerd`​

* centos

  ```bash
  # step 1: 安装必要的一些系统工具
  yum install -y yum-utils device-mapper-persistent-data lvm2
  # Step 2: 添加软件源信息
  yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
  # Step 3
  sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
  # Step 4: 更新并安装containerd
  yum makecache fast
  yum -y install containerd.io
  # Step 5: 开启containerd服务
  systemctl enable --now containerd
  ```
* ubuntu

  ```bash
  # step 1: 安装必要的一些系统工具
  apt-get update
  apt-get -y install apt-transport-https ca-certificates curl software-properties-common
  # step 2: 安装GPG证书
  curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
  # Step 3: 写入软件源信息
  add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
  # Step 4: 更新并安装containerd
  apt-get -y update
  apt-get install -y containerd.io
  # Step 5: 开启containerd服务
  systemctl enable --now containerd
  ```

#### 配置`containerd`​

修改containerd配置，并重启服务。

```bash
# 生成默认配置
mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
# 修改为阿里云镜像
sed -i 's#sandbox_image = "registry.k8s.io/pause:[^"]*"#sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"#' /etc/containerd/config.toml
# 启用SystemdCgroup
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
# 配置containerd代理镜像
sed -i '/\[plugins\."io.containerd.grpc.v1.cri"\.registry\]/,/config_path/s#config_path = ""#config_path = "/etc/containerd/certs.d"#' /etc/containerd/config.toml

# 配置 docker.io 镜像加速器
mkdir -p /etc/containerd/certs.d/docker.io
cat <<EOF | sudo tee /etc/containerd/certs.d/docker.io/hosts.toml
server = "https://docker.io"
[host."https://dockerproxy.cn"]
  capabilities = ["pull", "resolve"]
EOF

# 重启 containerd
systemctl restart containerd
```

### Kubernetes组件

为Kubernetes设置软件包仓库并安装`kubelet`​、`kubeadm`​、`kubectl`​。

* centos

  ```bash
  cat <<EOF | tee /etc/yum.repos.d/kubernetes.repo
  [kubernetes]
  name=Kubernetes
  baseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/
  enabled=1
  gpgcheck=1
  gpgkey=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/repodata/repomd.xml.key
  EOF
  setenforce 0
  yum install -y cri-tools kubernetes-cni kubelet kubeadm kubectl
  systemctl enable --now kubelet
  ```
* ubuntu

  ```bash
  apt-get update && apt-get install -y apt-transport-https
  curl -fsSL https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/deb/Release.key |
      gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
  echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/deb/ /" |
      tee /etc/apt/sources.list.d/kubernetes.list
  apt-get update
  apt-get install -y cri-tools kubernetes-cni kubelet kubeadm kubectl
  systemctl enable --now kubelet
  ```

配置 crictl 使用 containerd

```bash
cat <<EOF | tee /etc/crictl.yaml
runtime-endpoint: unix:///run/containerd/containerd.sock
EOF
```

## 集群初始化

### kubeadm

使用kubeadm初始化集群

```bash
# 拉取Kubernetes所需镜像
kubeadm config images pull --cri-socket=unix:///run/containerd/containerd.sock --image-repository=registry.aliyuncs.com/google_containers

# 配置和初始化 Kubernetes 集群
cat > kubeadm-config.yaml <<EOF 
kind: InitConfiguration
apiVersion: kubeadm.k8s.io/v1beta3
nodeRegistration:
    criSocket: unix:///run/containerd/containerd.sock
---
kind: ClusterConfiguration
apiVersion: kubeadm.k8s.io/v1beta3
imageRepository: registry.aliyuncs.com/google_containers
kubernetesVersion: 1.29.7
apiServer:
    certSANs: # --apiserver-cert-extra-sans
    - "127.0.0.1"
networking:
    podSubnet: "10.244.0.0/16" # --pod-network-cidr
---
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
EOF

kubeadm init --config kubeadm-config.yaml
```

### `kubectl`​

配置`kubectl`​以便可以管理集群

```bash
export KUBECONFIG=/etc/kubernetes/admin.conf
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

### 网络插件

Kubernetes 网络插件（CNI）用于管理集群中的网络功能，如 Pod 的互连、跨节点通信、网络隔离等。常见的网络插件有 Flannel、Calico、Weave、Cilium 等。它们在实现方式、功能和使用场景上有所不同。

#### **Flannel**

* **特点**: 简单易用，主要关注在二层网络（Layer 2）连接，通过覆盖网络（Overlay Network）实现 Pod 之间的通信。Flannel 使用 VXLAN、UDP 或 host-gw 作为后端实现，适合较小规模的集群。
* **适用场景**: 适用于对网络性能要求不高的中小型集群。
* **安装流程**

  ```bash
  kubectl apply -f https://mirror.ghproxy.com/https://raw.githubusercontent.com/flannel-io/flannel/v0.25.5/Documentation/kustomization/kube-flannel/kube-flannel.yml
  ```

#### **Calico**

* **特点**: 提供网络策略和路由功能，支持第三层网络（Layer 3）和 BGP 路由。Calico 可以直接使用路由表在不同节点之间传递数据，具备强大的网络策略管理能力，支持网络隔离和安全策略。
* **适用场景**: 适用于需要复杂网络策略、大规模部署的集群，对网络性能有较高要求。
* **安装流程**

  安装 Tigera Calico 运算符和自定义资源定义。

  ```bash
  kubectl create -f https://mirror.ghproxy.com/https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/tigera-operator.yaml
  ```

  通过创建必要的自定义资源来安装 Calico。

  > 在创建此清单之前，可能需要更改默认 IP 池 CIDR 以匹配 Pod 网络CIDR。
  >

  ```bash
  wget https://mirror.ghproxy.com/https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/custom-resources.yaml
  # 10.244.0.0/16 就是kubeadm初始化时配置中的pod-network-cidr
  sed -i 's/192.168.0.0\/16/10.244.0.0\/16/' custom-resources.yaml
  kubectl create -f custom-resources.yaml
  ```

  使用以下命令确认所有 Pod 都在运行，等待每个 Pod 的 `STATUS`​ 为 `Running`​。

  ```bash
  watch kubectl get pods -n calico-system
  ```

### 集群架构

#### 单节点集群

删除 `control plane`​ 上的污点，以便可以在其上调度 pod。

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
```

使用以下命令确认您的集群中现在有一个节点

```bash
kubectl get nodes -o wide
```

#### 多节点集群

在当前机器上获取 join-commjoin-command

```bash
# kubeadm token create --print-join-command
kubeadm join 192.168.64.19:6443 --token peezoe.zy87kldtoawn3z8e --discovery-token-ca-cert-hash sha256:31428b56c92697dca6db89e2257af249bde92ddcd947630d7d61832ce76598b1
```

在其他机器上同样执行**环境初始化**的流程，然后使用上面输出的命令，将其他机器加入集群

```bash
# 将其他机器作为从节点加入
kubeadm join 192.168.64.19:6443 --token v33g2t.6m41b0lh9u4gj84d \
	--discovery-token-ca-cert-hash sha256:31428b56c92697dca6db89e2257af249bde92ddcd947630d7d61832ce76598b1

# 将其他机器作为控制节点加入， 控制节点加入集群需要加上--control-plane
kubeadm join 192.168.64.19:6443 --token v33g2t.6m41b0lh9u4gj84d \
	--discovery-token-ca-cert-hash sha256:31428b56c92697dca6db89e2257af249bde92ddcd947630d7d61832ce76598b1 \
    --control-plane
```

‍
