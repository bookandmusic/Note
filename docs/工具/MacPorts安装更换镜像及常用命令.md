---
title: MacPorts安装更换镜像及常用命令
createTime: 2024/07/08 11:21:16
permalink: /article/x2pirswp/
tags:
  - Mac
  - 镜像
category: 工具
---

本文主要介绍了如何在Mac上使用Macports进行软件包管理。首先需要检查是否已经安装了XCode，并下载Macports的安装包。接着需要修改系统环境变量PATH，以便正确地调用Macports的命令行工具。为了加快下载速度，还可以更换为清华大学提供的镜像源。一旦安装完成，就可以使用一系列命令来管理已安装的软件包，例如更新信息库、安装新的软件包、清理临时文件、卸载软件包以及升级已有的软件包等等。通过使用Macports，用户可以方便地管理和维护自己的软件包，从而提高工作效率和体验。

## **准备及下载**

1. 检查下 **XCode** 安装

   ```python
    sudo xcodebuild -license   # 苹果App搜索 Xcode 可直接下载安装（好几个G）
   ```
2. **Macports** 官网下载 *安装包*
   [https://www.macports.org/install.php](https://www.macports.org/install.php)
   选择对应 *Mac 版本* 下载

## **安装 macports**

1. 关闭 **wifi**
   默认源是境外的，先断网
2. 运行下载好的包，依步骤继续
   语言可选中文

   > **异常处理:**    若安装至 “**正在运行软件包脚本**” 会卡住，窗口关不掉
   >

   1. 点击 **安装器** 窗口 ，**Command + Alt + Esc** 强制退出
   2. 打开 **终端** （ Command + 空格，输入 terminal）

      ```python
      ps aux | grep install       # 找到...macports...pkg进程号 xxxxx
      sudo kill xxxxx             # 杀掉 macports 相关进程号
      ```
3. 确保 **断网**，重新打开包安装，即可安装成功

## **修改 PATH**

1. 检查 profile 文件是否 *可读写*

   ```python
   open /etc       # 打开 profile 目录
   ```

   右键 **profile** 文件， ****显示简介**** 最下面先点右下角的锁??，解锁
   最下面名称框 **系统**，对应的权限，若是 **只读** 点选成 **可读写**
2. 修改 *profile*

   ```python
   export PATH=/opt/local/bin:$PATH
   export PATH=/opt/local/sbin:$PATH
   ```

   修改完成可将 **profile** 文件改回 **只读**

## **更换清华镜像源**

1. ​`/opt/local/etc/macports/sources.conf`​​

   ```python
   # 把最后一行 rsync:// 开头的改成
   rsync://mirrors.tuna.tsinghua.edu.cn/macports/release/ports/ [default]
   ```
2. ​`/opt/local/etc/macports/macports.conf `​

   ```python
   # 修改整行 #rsync_server xxxxxx
   #rsync_server           mirrors.tuna.tsinghua.edu.cn

   # 修改整行 #rsync_dir xxxxxxx
   #rsync_dir              macports/release/base/
   ```

## **Macports 运行**

```python
sudo port -v sync	  # 重新加载macports文件信息
sudo port -v selfupdate	  # 更新

sudo port sync	          # 重新加载macports文件信息
sudo port selfupdate	  # 更新

port list                 # 查看Mac Port中当前可用的软件包及其版本

port search name # 搜索索引中的软件

port info name # 查看包详细信息

port deps name # 查看包详细信赖信息

port variants name # 查看安装时允许客户定制的参数

sudo port install name # 安装新软件

sudo port clean --all name # 安装完毕之后，清除安装时产生的临时文件

sudo port uninstall name  # 卸载软件

sudo port upgrade A B C # 单独升级需要的软件 (包)，比如: A B C

port outdated  # 查看有更新的软件以及版本

sudo port upgrade outdated  # 接升级所有旧软件 (包)（不推荐）

port installed inactive # 列出所有「非激活」态的软件 (包)

sudo port uninstall inactive # 删除没有用到的软件 (包)

port echo leaves # 查看是否有不需要的依赖

sudo port uninstall leaves # 删除不需要的依赖,一般需要删除多次，因为有些依赖是循环依赖于前一个不需要的依赖。直到报错说没有匹配的结果为止。
```
