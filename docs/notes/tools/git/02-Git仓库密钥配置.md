---
title: 02-Git仓库密钥配置
createTime: 2025/03/21 22:12:18
permalink: /git/qmx56gh3/
---

git使用https协议，每次pull, push都要输入密码，相当的麻烦。这个时候就可以使用ssh密钥进行身份认证，这样可以省去每次都输密码。

### 本地密钥生成

终端输入命令

```shell
# 创建两个密钥
ssh-keygen -t rsa -C "您的邮箱" -f ~/.ssh/id_rsa
ssh-keygen -t rsa -C "您的邮箱" -f ~/.ssh/xct_rsa
```

然后系统会自动在`.ssh`​文件夹下生成两对文件，`id_rsa`​、`id_rsa.pub`​和`xct_rsa`​、`xct_rsa.pub`​，`.pub`​为公钥，另一个是私钥。

### 远程仓库密钥配置

> 类似于`id_rsa`​作为Guthub仓库的认证密钥流程，可以将`xct_rsa`​作为Gitee仓库的认证密钥

打开[https://github.com/](https://github.com/)，登陆你的账户，进入设置

进入ssh设置

点击 `New SSH key`

在key中将`id_rsa.pub`​的内容粘贴进去

最后点击`Add SSH key`​

在本机在终端输入

```shell
ssh -T git@github.com
```

你将会看到：

```shell
The authenticity of host 'github.com (207.97.227.239)' can't be established.
RSA key fingerprint is 16:27:ac:a5:76:28:2d:36:63:1b:56:4d:eb:df:a6:48.
Are you sure you want to continue connecting (yes/no)?
```

输入 yes

```shell
Hi humingx! You've successfully authenticated, but GitHub does not provide shell access.
```

如果看到Hi后面是你的用户名，就说明成功了。

### 本机SSH配置

刚才给`Github`​和`Gitee`​分别配置不同的密钥，但由于 Git 会默认使用 `id_rsa`​密钥对，所以我们需要做些配置，告诉 Git 根据不同的域名选择不同的私钥。

在配置文件`~/.ssh/config`​中添加如下配置：

```ini

#Host <主机别名或通配符>
#  HostName <实际主机名或IP地址>
#  User <用户名>
#  Port <端口号>
#  IdentityFile <私钥文件路径>
#  ForwardAgent <是否启用代理转发，yes/no>
#  ServerAliveInterval <服务器保活间隔秒数>
#  ServerAliveCountMax <最大保活尝试次数>
#  Compression <是否启用压缩，yes/no>


Host github.com
    Hostname github.com
    IdentityFile ~/.ssh/id_rsa
    PreferredAuthentications publickey

Host gitee.com
    Hostname gitee.com
    IdentityFile ~/.ssh/xct_rsa
    PreferredAuthentications publickey

# 多个配置类似

# Host * 适用于所有主机，可以设置全局默认行为
Host *
  ServerAliveInterval 60
  ServerAliveCountMax 5
  ForwardAgent yes
```

**验证配置是否成功**
ssh -T git@{Host}，Host 对应 config 中的 Host 域名

```
ssh -T git@github.com
ssh -T git@gitee.com
```

## 错误解析

### 密钥未配置

- 错误原因：

当使用git方式下载时，如果没有配置过`ssh key`，则会有如下错误提示：

```bash
git@github.com:Permissiondenied(publickey) 
fatal: Could not read from remote repository
```

- 解决方案：

正常配置`ssh`密钥即可。

### 密钥不匹配

> 重装系统之后,git push的时候会出现问题:`The authenticity of host 'github.com (13.229.188.59)' can't be established.`

- 错误原因：

本地仓库和远程的SSH密钥不匹配

- 解决办法：

重新配置仓库密钥即可

### 免密登录失败

> 在本地电脑上已经配置过 密钥，但是每次上传、下载仍然需要输入用户名和密码

- 错误原因

首先来明确一下需要每次输入用户名和密码的场景：

首先，必须是使用`https`方式下载的代码在操作时才可能需要输入用户名密码。

第二，在满足第一点的基础上，未配置`credential.helper`。可以用如下命令检查`credential.helper`的当前配置：

```bash
git config -l | grep credential.helper
```

如果未配置的话结果应该为空。

- 解决方案：

方案一, 既然是因为本地仓库和远程仓库关联时使用 `ssh`方式，才会没有使用密钥验证身份，而是重复输入密码验证。因此，可以删除`https`方式的本地仓库的远程连接，然后添加`ssh`方式的远程链接

方案二, 既然是因为未配置`credential.helper`。简单粗暴的办法就是直接配置`credential.helper`的值为`manager`

```bash
git config  --global credential.helper manager
```

再次尝试`pull`代码的时候会弹出窗口要求输入用户名密码（只需要输入这一次就ok了）。
