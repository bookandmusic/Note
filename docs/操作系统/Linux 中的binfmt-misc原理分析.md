---
title: Linux 中的binfmt-misc原理分析
createTime: 2024/07/21 11:21:16
permalink: /article/0edl645b/
tags:
  - Linux
category: 操作系统
---

binfmt-misc(Miscellaneous Binary Format)是 Linux 内核提供的一种类似 Windows 上文件关联的功能，但比文件关联更强大的是，它不仅可以根据文件后缀名判断，还可以根据文件内容 (Magic Bytes) 使用不同的程序打开。一个典型的使用场景就是：使用`qemu`​运行其它架构平台上的二进制文件。

QEMU 是一个处理器模拟器，可以模拟不同的 CPU 架构，我们可以把它理解为是另一种形式的虚拟机。例如，在 x86 主机上执行一个 ARM 二进制文件时，QEMU 可以模拟 ARM 环境并运行 ARM 二进制文件。

本文以该场景为例，分析一下其具体的工作原理。

## 开启 binfmt-misc

临时开启可以使用以下命令：

```console
$ mount binfmt_misc -t binfmt_misc /proc/sys/fs/binfmt_misc
```

这种方式重启后会失效，如果想长期生效，可以在`/etc/fstab`​文件中增加一行：

```console
none  /proc/sys/fs/binfmt_misc binfmt_misc defaults 0 0
```

可以使用以下命令检查开启是否成功：

```console
$ mount | grep binfmt_misc
systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=29,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=15479)
```

## 在 x86_64 系统中运行 arm64 应用

先准备一个 arm64 架构的程序 (可以使用 go 跨平台编译生成一个)，执行后发现有报错：

```console
$ ./hello-arm
-bash: ./hello-arm: cannot execute binary file: Exec format error
```

现在，我们执行一下`apt install qemu-user-binfmt`​命令，然后再运行上面的 arm64 程序，发现能正常运行了。安装`qemu-user-binfmt`​后，会在`/proc/sys/fs/binfmt_misc`​目录下创建若干个文件：

```console
$ ls /proc/sys/fs/binfmt_misc
python3.10    qemu-arm    qemu-hexagon  qemu-microblaze  qemu-mips64el  qemu-mipsn32el  qemu-ppc64le  qemu-s390x  qemu-sparc        qemu-xtensa    status
qemu-aarch64  qemu-armeb  qemu-hppa     qemu-mips        qemu-mipsel    qemu-ppc        qemu-riscv32  qemu-sh4    qemu-sparc32plus  qemu-xtensaeb
qemu-alpha    qemu-cris   qemu-m68k     qemu-mips64      qemu-mipsn32   qemu-ppc64      qemu-riscv64  qemu-sh4eb  qemu-sparc64      register
```

其中就有一个`qemu-aarch64`​。来看一下这个文件的内容：

```
$ cat /proc/sys/fs/binfmt_misc/qemu-aarch64
enabled
interpreter /usr/libexec/qemu-binfmt/aarch64-binfmt-P
flags: POC
offset 0
magic 7f454c460201010000000000000000000200b700
mask ffffffffffffff00fffffffffffffffffeffffff
```

这个文件描述的是规则文件:

* 第一行`enabled`​表示该规则启用；
* 第二行`interpreter /usr/libexec/qemu-binfmt/aarch64-binfmt-P`​表示使用`/usr/libexec/qemu-binfmt/aarch64-binfmt-P`​来执行二进制文件；
* 第三行`flags: POC`​表示运行的标志位，具体含义如下：

  * ​`P`​: 表示 perserve-argv，这意味着在调用模拟器时，原始的参数（argv）将被保留。这对于某些程序在运行时需要知道它们自己的名称（即 argv[0]）的情况很有用
  * ​`O`​: 表示 offset，这意味着在启动模拟器之前，需要从二进制文件中读取一个偏移量。这个偏移量将作为模拟器的一个参数
  * ​`C`​: 表示 credentials，这意味着模拟器将使用与原始程序相同的用户 ID 和组 ID 运行。这有助于确保模拟器在运行时具有与原始程序相同的权限
* 第四行`offset 0`​表示从`0`​偏移值开始读取文件；
* 第五行`magic 7f454c460201010000000000000000000200b700`​表示要匹配的魔术字节；`mask ffffffffffffff00fffffffffffffffffeffffff`​表示字节掩码，用来忽略掉文件中的一些不重要的字节。

可以看出，这条规则会使用`/usr/libexec/qemu-binfmt/aarch64-binfmt-P`​来执行 arm64 架构的二进制文件，而这个文件其实是一个软链，实际指向的是：`/usr/bin/qemu-aarch64`​。

```console
$ ls -l /usr/libexec/qemu-binfmt/aarch64-binfmt-P
lrwxrwxrwx 1 root root 22 Jun  6 00:25 /usr/libexec/qemu-binfmt/aarch64-binfmt-P -> ../../bin/qemu-aarch64
```

## 手动创建执行规则

在上面的例子中，`/proc/sys/fs/binfmt_misc/qemu-aarch64`​文件是在安装 qemu 库的时候自动安装进去的。如果想手动创建一条规则，该怎么操作呢？

我们先将以下代码保存到文件`main.go`​中：

```go
package main
import (
    "fmt"
    "os"
)
func main() {
    fmt.Println("Program name:", os.Args[0])
    if len(os.Args) > 1 {
        fmt.Println("Arguments:")
        for i, arg := range os.Args[1:] {
            fmt.Printf("Arg %d: %s\n", i+1, arg)
        }
    } else {
        fmt.Println("No arguments provided.")
    }
}
```

使用命令：`go build -o fake-runner ./main.go`​进行编译，并将编译出来的`fake-runner`​拷贝到`/usr/local/bin`​目录下。

此时，我们需要向`/proc/sys/fs/binfmt_misc/register`​中按照`:name:type:offset:magicinterpreter:flags`​的格式写入规则。

* name: 规则名
* type: 类型，取`E`​(按扩展名匹配) 或`M`​(按文件魔术字节匹配) 之一
* offset: 当`type`​为`M`​时生效，表示魔术字节的偏移值
* magic: 当`type`​为`E`​时，表示要匹配的后缀名；当`type`​为`M`​时，表示 16 进制的魔术字节
* mask: 当`type`​为`M`​时生效，表示魔术字节的掩码，与 IP 地址掩码类似
* interpreter: 解释器文件的绝对路径
* flags: 含义与上面的`flags`​一致

假设我们想用`fake-runner`​打开以`12344578`​开头的文件，可以执行以下命令：

```console
# echo ':binfmt-test:M::12345678::/usr/local/bin/fake-runner:P' > /proc/sys/fs/binfmt_misc/register
# cat /proc/sys/fs/binfmt_misc/binfmt-test 
enabled
interpreter /usr/local/bin/fake-runner
flags: P
offset 0
magic 3132333435363738
```

此命令需要在 root 权限下运行。

然后使用命令生成目标文件：

```
$ echo 12345678 > /tmp/test.txt
$ chmod 755 /tmp/test.txt
$ /tmp/test.txt hello
Program name: /usr/local/bin/fake-runner
Arguments:
Arg 1: /tmp/test.txt
Arg 2: /tmp/test.txt
Arg 3: hello
```

删除规则可以使用命令：`echo -1 > /proc/sys/fs/binfmt_misc/binfmt-test`​

## 在 x86_64 系统中运行 arm64 架构的 Docker 镜像

现在我们用 docker 命令运行一个 arm64 的镜像：

```console
$ docker run --rm --platform=arm64 -it ubuntu uname -m
exec /usr/bin/uname: no such file or directory
```

通过一番探索之后，发现只要执行下命令：`apt install qemu-user-static`​，再启动 docker 容器就正常了。

```console
$ docker run --rm --platform=arm64 -it ubuntu uname -m
aarch64
```

执行这条命令会修改`/usr/libexec/qemu-binfmt/aarch64-binfmt-P`​文件的软链到`/usr/bin/qemu-aarch64-static`​。

```console
$ cat /proc/sys/fs/binfmt_misc/qemu-aarch64
enabled
interpreter /usr/libexec/qemu-binfmt/aarch64-binfmt-P
flags: POCF
offset 0
magic 7f454c460201010000000000000000000200b700
mask ffffffffffffff00fffffffffffffffffeffffff
```

我们来看下`qemu-aarch64`​和`qemu-aarch64-static`​区别：

```console
$ ldd /usr/bin/qemu-aarch64
        linux-vdso.so.1 (0x00007fffd65e1000)
        libz.so.1 => /lib/x86_64-linux-gnu/libz.so.1 (0x00007f5eca77c000)
        liburing.so.2 => /lib/x86_64-linux-gnu/liburing.so.2 (0x00007f5eca775000)
        libglib-2.0.so.0 => /lib/x86_64-linux-gnu/libglib-2.0.so.0 (0x00007f5eca63b000)
        libgmodule-2.0.so.0 => /lib/x86_64-linux-gnu/libgmodule-2.0.so.0 (0x00007f5eca634000)
        libgnutls.so.30 => /lib/x86_64-linux-gnu/libgnutls.so.30 (0x00007f5eca449000)
        libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f5eca21d000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f5eca134000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f5eca114000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f5ec9eeb000)
        libpcre.so.3 => /lib/x86_64-linux-gnu/libpcre.so.3 (0x00007f5ec9e75000)
        libp11-kit.so.0 => /lib/x86_64-linux-gnu/libp11-kit.so.0 (0x00007f5ec9d3a000)
        libidn2.so.0 => /lib/x86_64-linux-gnu/libidn2.so.0 (0x00007f5ec9d19000)
        libunistring.so.2 => /lib/x86_64-linux-gnu/libunistring.so.2 (0x00007f5ec9b6d000)
        libtasn1.so.6 => /lib/x86_64-linux-gnu/libtasn1.so.6 (0x00007f5ec9b55000)
        libnettle.so.8 => /lib/x86_64-linux-gnu/libnettle.so.8 (0x00007f5ec9b0f000)
        libhogweed.so.6 => /lib/x86_64-linux-gnu/libhogweed.so.6 (0x00007f5ec9ac7000)
        libgmp.so.10 => /lib/x86_64-linux-gnu/libgmp.so.10 (0x00007f5ec9a45000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f5ecacc3000)
        libffi.so.8 => /lib/x86_64-linux-gnu/libffi.so.8 (0x00007f5ec9a36000)
$ ldd /usr/bin/qemu-aarch64-static
        not a dynamic executable
```

可以看出，`qemu-aarch64-static`​ 是没有动态库依赖的，也就是说，docker 必须使用静态编译的`qemu`​才能工作。

> 容器内实际执行ARM64文件，是由内核实现的，也就是说内核会调用对应的规则，规则中指定的解释器路径，不管是静态解释器，还是包含动态库的解释器，容器内都是无法访问到的。因此，解释器是否包含动态库，不是根本原因，那具体是为什么呢？

分析两次规则，发现`flags`​有一个参数`F`​区别：

可以参考这个[问题描述](https://bugs.launchpad.net/ubuntu/+source/qemu/+bug/1815100)：解释器文件（例如 qemu-arm-static）是在安装其 `binfmt `​规则时加载的，而不是在遇到需要它的文件时加载的。当内核遇到需要该解释器的文件时，它只是执行已经打开的文件描述符，而不是打开一个新的文件描述符（IOW：内核已经打开了正确的文件描述符，因此可以允许外部架构的命名空间/容器/chroot像本地架构一样运行）。

通过上面的解释可以看出，如果解释器是一个静态文件，就可以直接加载到内核中，容器中可以执行使用；但是还有其他动态库，就无法加载到内核中，容器中又没有挂载这些路径，就会找不到解释器文件，最后就会无法执行其他平台二进制文件。

之前都是在主机上直接安装解释器文件，也可以通过运行一个特权容器来实现以上流程：

```console
# 以下两个命令都可以添加解释器规则，并将解释器文件直接加载到内核
$ docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
$ docker run --rm --privileged tonistiigi/binfmt --install all
$ cat /proc/sys/fs/binfmt_misc/qemu-aarch64
enabled
interpreter /usr/bin/qemu-aarch64-static
flags: F
offset 0
magic 7f454c460201010000000000000000000200b700
mask ffffffffffffff00fffffffffffffffffeffffff

# 只添加解释器规则，然后执行对应平台的文件，还需要保证容器内有真正的解释器文件
$ docker run --rm --privileged multiarch/qemu-user-static --reset
$ cat /proc/sys/fs/binfmt_misc/qemu-aarch64
enabled
interpreter /usr/bin/qemu-aarch64-static
flags:
offset 0
magic 7f454c460201010000000000000000000200b700
mask ffffffffffffff00fffffffffffffffffeffffff
$ docker run -v /usr/bin/qemu-aarch64-static:/usr/bin/qemu-aarch64-static --rm --platform=
arm64 -it ubuntu uname -m
aarch64

# 卸载所有的qemu解释器
$ docker run --rm --privileged dockerpull.com/tonistiigi/binfmt --uninstall qemu-*
```

## 总结

binfmt-misc 提供了灵活的文件关联机制，使得部分无法直接执行的程序可以像普通 Linux 程序一样直接运行起来（如：跨架构程序、Windows exe 等）。

## 参考

* [https://www.drunkdream.com/2024/02/07/linux-binfmts/](https://www.drunkdream.com/2024/02/07/linux-binfmts/)
* [docker - What does running the multiarch/qemu-user-static does before building a container? - Stack Overflow](https://stackoverflow.com/questions/72444103/what-does-running-the-multiarch-qemu-user-static-does-before-building-a-containe)
* [Bug #1815100 “qemu-user-static needs to binfmt with --fix-binary...” ](https://bugs.launchpad.net/ubuntu/+source/qemu/+bug/1815100)

‍
