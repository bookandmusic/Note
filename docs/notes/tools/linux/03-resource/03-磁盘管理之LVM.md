---
title: 03-磁盘管理之LVM
createTime: 2025/03/21 22:12:18
permalink: /linux/resource/m39f7vn1/
---
> 原文地址 [https://www.cnblogs.com/zhaojiedi1992/p/zhaojiedi_linux_042_lvm.html](https://www.cnblogs.com/zhaojiedi1992/p/zhaojiedi_linux_042_lvm.html)

## LVM 是什么

LVM 是 Linux 操作系统的逻辑卷管理器。 现在有两个 Linux 版本的 LVM, 分别是 LVM1,LVM2。LVM1 是一种已经被认为稳定了几年的成熟产品，LVM2 是最新最好的 LVM 版本。 LVM2 几乎完全向后兼容使用 LVM1 创建的卷。此例外是快照（在升级到 LVM 2 之前，必须删除快照卷）。

## LVM 简介

逻辑卷管理提供了比传统的磁盘和分区视图更高级别的计算机系统上磁盘存储的视图。 这使得系统管理员可以更灵活地将存储分配给应用程序和用户。

在逻辑卷管理器的控制下创建的存储卷可以随意调整大小和移动，尽管这可能需要对文件系统工具进行一些升级。

逻辑卷管理器还允许管理用户定义组中的存储卷，允许系统管理员处理明显命名的卷组（如 “development” 和“sales”），而不是物理磁盘名称，例如 “sda” 和“sdb”

## LVM 基本术语

#### volume group (VG)

卷组是 LVM 中使用的最高级别的抽象。 它将逻辑卷和物理卷集合在一起成为一个管理单元。

#### physical volume (PV)

一个物理卷通常是一个硬盘，虽然它可能只是一个看起来像一个硬盘（如软件 RAID 设备）的设备。

#### logical volume (LV)

相当于非 LVM 系统中的磁盘分区。 LV 作为标准块设备可见; 因此 LV 可以包含文件系统（例如 / home）。

#### physical extent (PE)

每个物理卷都被划分为数据块（称为物理扩展盘区），这些扩展盘区与卷组的逻辑盘区具有相同的大小。

#### logical extent (LE)

每个逻辑卷都被分割成数据块，称为逻辑盘区。 卷组中的所有逻辑卷的区段大小都是相同的。

#### 几个概念的关系

一个具体的例子将有助于：

假设我们有一个名为 VG1 的卷组，这个卷组的物理盘区大小为 4MB。 在这个卷组中，我们引入了 2 个硬盘分区 / dev/hda1 和 / dev/hdb1。
这些分区将成为物理卷 PV1 和 PV2（管理员可以自行决定是否提供更有意义的名称）。
PV 被分成 4MB 块，因为这是卷组的大小。磁盘大小不同，我们在 PV1 中获得 99 个扩展盘区，在 PV2 中获得 248 个扩展盘区。
我们现在可以创建自己的逻辑卷，它可以是 1 到 347（248 + 99）范围之间的任何大小。
当创建逻辑卷时，在逻辑盘区和物理盘区之间定义映射，例如， 逻辑盘区 1 可以映射到 PV1 的物理盘区 51 上，写入逻辑盘的第一个 4MB 的数据实际上被写入到 PV1 的第 51 盘区。

#### 映射模式

线性映射 : 将分配一定范围的 PE 到 LV 的一个区域，例如 LE 1 - 99 映射到 PV1，LE 100 - 347 映射到 PV2。

分条映射 : 将跨多个物理卷交织逻辑盘区的块，这个方式一定程度上提高了性能，具体如下

```sh
1st chunk of LE[1] -> PV1[1] # 第一个逻辑块在 PV1 设备上， 第二个在 PV2 设备上，等等。
2nd chunk of LE[1] -> PV2[1]
3rd chunk of LE[1] -> PV3[1]
4th chunk of LE[1] -> PV1[2]
```

　　

#### Snapshots(快照）：

这是 LVM 提供的一个非常棒的功能就是快照了，他允许管理员创建一个新的块设备来呈现一个逻辑卷的的精确副本，在某个时间冻结，管理员可以及时备份指定一致状态下的数据，备份完毕就可以删除设备了。

快照最初包含有关快照的一些元数据，但没有来自源逻辑卷的实际数据。快照使用写时复制（copy on write）技术来检测数据在原始数据块中何时更改。它将拍摄快照时保存的值复制到快照卷中的块中，然后允许将新数据存储在源块中。

随着更多块从源逻辑卷上的原始值发生更改，快照大小也会增加。如果快照卷变满，它将被丢弃，所以分配足够的空间是非常重要的，具体取决于你数据的变换情况，如果快照大小和原始数据一样大，它将永远不会溢出的。

## 安装 LVM

```
[root@centos7 ~]$ rpm -q lvm2                           # 查看lvm2是否安装了， 我使用的centos7，这是安装的了
lvm2-2.02.171-8.el7.x86_64
[root@centos7 ~]$ # yum -y install lvm2                 # 没有安装的话使用yum安装
```

## 常用命令简介

```
[root@centos7 ~]$ pv                                                   # 使用tab按键获取pv相关命令
pvchange   pvck       pvcreate   pvdisplay  pvmove     pvremove   pvresize   pvs        pvscan
[root@centos7 ~]$ vg                                                   # 使用tabl按键获取vg相关的命令
vgcfgbackup    vgck           vgdisplay      vgimport       vgmknodes      vgrename       vgsplit
vgcfgrestore   vgconvert      vgexport       vgimportclone  vgreduce       vgs          
vgchange       vgcreate       vgextend       vgmerge        vgremove       vgscan       
[root@centos7 ~]$ lv                                                   # 使用tabl按键获取lv先关的命令
lvchange     lvdisplay    lvmconf      lvmdump      lvmsadc      lvremove     lvs        
lvconvert    lvextend     lvmconfig    lvmetad      lvmsar       lvrename     lvscan     
lvcreate     lvm          lvmdiskscan  lvmpolld     lvreduce     lvresize
```

上面的命令比较多，简单介绍几个常用的命令。

* pv 打头的：代表 pv 相关的命令
* vg 带头的：代表 vg 相关的命令
* lv 带头的： 代表 lv 相关的命令
* create: 创建相关
* remove: 移除相关
* display: 显示相关
* import: 导入 相关
* export: 导出相关
* rename: 重命名
* vgchange: 改变状态相关
* extend: 扩展相关
* reduce: 缩进相关

## 使用 LVM

#### pv 创建

pv 作用：初始化磁盘和磁盘分区

在将磁盘或者磁盘分区用作物理卷（PV）之前，你需要对其进行初始化工作。

```shell
[root@centos7 ~]$ pvcreate /dev/sdb1
```

注意：

1. 不建议对整个磁盘做 PV 初始化工作。因为其他操作系统不能识别 LVM 元数据，导致我们认为磁盘是空闲的，重新设置分区覆盖原有数据
2. 如果是分区需要调整分区的类型为 LVM(代码为 8e)

分区并设置分区类型

```shell
[root@centos7 ~]$ fdisk -l

Disk /dev/sda: 214.7 GB, 214748364800 bytes, 419430400 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0x000b0b8a

   Device Boot      Start         End      Blocks   Id  System
/dev/sda1   *        2048     2099199     1048576   83  Linux
/dev/sda2         2099200   270534655   134217728   83  Linux
/dev/sda3       270534656   372934655    51200000   83  Linux
/dev/sda4       372934656   419430399    23247872    5  Extended
/dev/sda5       372938752   413898751    20480000   83  Linux

Disk /dev/sdb: 107.4 GB, 107374182400 bytes, 209715200 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0x93d380cf

   Device Boot      Start         End      Blocks   Id  System
/dev/sdb1            2048     2099199     1048576   8e  Linux LVM
/dev/sdb2         2099200     4196351     1048576   8e  Linux LVM

Disk /dev/sde: 21.5 GB, 21474836480 bytes, 41943040 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0x73afb36f

   Device Boot      Start         End      Blocks   Id  System
/dev/sde1            2048     2099199     1048576   8e  Linux LVM
/dev/sde2         2099200     6293503     2097152   8e  Linux LVM

Disk /dev/sdd: 21.5 GB, 21474836480 bytes, 41943040 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0x7e0900d8

   Device Boot      Start         End      Blocks   Id  System
/dev/sdd1            2048     2099199     1048576   8e  Linux LVM
/dev/sdd2         2099200    12584959     5242880   8e  Linux LVM

Disk /dev/sdc: 21.5 GB, 21474836480 bytes, 41943040 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0xc56b90d8

   Device Boot      Start         End      Blocks   Id  System
/dev/sdc1            2048     2099199     1048576   8e  Linux LVM
/dev/sdc2         2099200     4196351     1048576   8e  Linux LVM

Disk /dev/sdf: 21.5 GB, 21474836480 bytes, 41943040 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes

[root@centos7 ~]$ partprobe 
Warning: Unable to open /dev/sr0 read-write (Read-only file system).  /dev/sr0 has been opened read-only.
[root@centos7 ~]$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0  200G  0 disk 
├─sda1   8:1    0    1G  0 part /boot
├─sda2   8:2    0  128G  0 part 
├─sda3   8:3    0 48.8G  0 part /
├─sda4   8:4    0  512B  0 part 
└─sda5   8:5    0 19.5G  0 part /app
sdb      8:16   0  100G  0 disk 
├─sdb1   8:17   0    1G  0 part 
└─sdb2   8:18   0    1G  0 part 
sdc      8:32   0   20G  0 disk 
├─sdc1   8:33   0    1G  0 part 
└─sdc2   8:34   0    1G  0 part 
sdd      8:48   0   20G  0 disk 
├─sdd1   8:49   0    1G  0 part 
└─sdd2   8:50   0    5G  0 part 
sde      8:64   0   20G  0 disk 
├─sde1   8:65   0    1G  0 part 
└─sde2   8:66   0    2G  0 part 
sdf      8:80   0   20G  0 disk 
sr0     11:0    1  8.1G  0 rom  /run/media/root/CentOS 7 x86_64
```

上面我们在 / dev/sd{b,c,d,e} 这 4 个盘每个都有 2 个类型为 lvm 的盘。接下来使用 pvcreat 初始化为物理卷

```
[root@centos7 ~]$ pvcreate /dev/sd{b1,b2,c1,c2,d1,d2,e1,e2} -y        # 这里加入了-y选项，之前的盘有文件系统的。 我这里强制创建了
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Wiping xfs_external_log signature on /dev/sdb2.
  Physical volume "/dev/sdb1" successfully created.
  Physical volume "/dev/sdb2" successfully created.
  Physical volume "/dev/sdc1" successfully created.
  Physical volume "/dev/sdc2" successfully created.
  Physical volume "/dev/sdd1" successfully created.
  Physical volume "/dev/sdd2" successfully created.
  Physical volume "/dev/sde1" successfully created.
  Physical volume "/dev/sde2" successfully created.
```

#### pv 信息查看

```
[root@centos7 ~]$ pvs                                           # 详细信息可以使用pvdisplay查看
  PV         VG         Fmt  Attr PSize    PFree   
  /dev/sdb1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sdb2             lvm2 ---     1.00g    1.00g
  /dev/sdc1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sdc2             lvm2 ---     1.00g    1.00g
  /dev/sdd1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sdd2             lvm2 ---     5.00g    5.00g
  /dev/sde1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sde2             lvm2 ---     2.00g    2.00g
```

#### vg 创建

vg 的创建是比较简单的。

```
[root@centos7 ~]$ vgcreate  vg_test_01 /dev/sd{b1,c1,d1,e1}    # 上面我们创建了8个pv，这里我们使用4个1的设备去创建vg,创建后默认vg是激活状态的
  Volume group "vg_test_01" successfully created
```

#### vg 信息的查看

```
[root@centos7 ~]$ vgs                                 # 查看简短的信息
  VG         #PV #LV #SN Attr   VSize VFree
  vg_test_01   4   0   0 wz--n- 3.98g 3.98g
[root@centos7 ~]$ vgdisplay                           # 查看详细的信息
 --- Volume group ---
  VG Name               vg_test_01                    # vg的名字
  System ID           
  Format                lvm2                          # lvm格式， 这里是lvm2的
  Metadata Areas        4
  Metadata Sequence No  1
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                0
  Open LV               0
  Max PV                0
  Cur PV                4
  Act PV                4
  VG Size               3.98 GiB                       # 这是我们4个pv的总大小
  PE Size               4.00 MiB                       # pe的大小
  Total PE              1020
  Alloc PE / Size       0 / 0                          # 分配的大小，这里我们还没有创建lv，所以为0
  Free  PE / Size       1020 / 3.98 GiB                # 分配后剩余的空间，第一个数是剩余的个数，第二个数是剩余的空间大小，2个都是剩余的只是单位表示不一样而已
  VG UUID               Y5NjjP-e3Aq-3u6E-gw6P-fLyy-Y5pN-ryyN9R  # vg设备的uuid
```

#### vg 的激活

```
[root@centos7 ~]$ vgchange -a y vg_test_01                               # 我们上面就是激活状态的，如果我们重启系统，或者vgchange -y n命令关闭了，就需要这个命令启动下
  0 logical volume(s) in volume group "vg_test_01" now active
```

#### vg 的移除

```
[root@centos7 ~]$ vgchange -a n vg_test_01                       # 要想移除vg，需要先关闭vg才能移除，这里先关闭
  0 logical volume(s) in volume group "vg_test_01" now active
[root@centos7 ~]$ vgremove  vg_test_01                           # 移除vg,
```

#### vg 的添加成员

```
[root@centos7 ~]$ vgcreate  vg_test_01 /dev/sd{b1,c1,d1,e1}       # 上面我把vg删了，这里重新添加进来
  Volume group "vg_test_01" successfully created
[root@centos7 ~]$ vgextend vg_test_01  /dev/sdb2                  # 添加一个pv2到vg中来
  Volume group "vg_test_01" successfully extended
```

#### vg 的删除成员

这个操作需要使用 vgdisplay 查看 vg 的使用情况和删除的 pv 上没有数据。如果有使用 pvmove 迁移完毕数据才能移除。

```
[root@centos7 ~]$ vgreduce  vg_test_01  /dev/sdb2
  Removed "/dev/sdb2" from volume group "vg_test_01"
```

#### lv 的创建

```
[root@centos7 ~]$ vgdisplay                        # lv逻辑卷创建之前， 需要查看下vg信息
  --- Volume group ---
  VG Name               vg_test_01
  System ID           
  Format                lvm2
  Metadata Areas        4
  Metadata Sequence No  3
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                0
  Open LV               0
  Max PV                0
  Cur PV                4
  Act PV                4
  VG Size               3.98 GiB
  PE Size               4.00 MiB
  Total PE              1020
  Alloc PE / Size       0 / 0   
  Free  PE / Size       1020 / 3.98 GiB
  VG UUID               sZwHea-LabA-SJaV-Wz40-qFp3-Um2w-pvmJAY
   
[root@centos7 ~]$ lvcreate -L 2G  -n lv_test_01 vg_test_01                 # 我们的vg是近4G的，我这里创建一个2G的lv,之前磁盘使用了文件系统慈爱有如下警告。输入y即可。
WARNING: linux_raid_member signature detected on /dev/vg_test_01/lv_test_01 at offset 4096. Wipe it? [y/n]: y
  Wiping linux_raid_member signature on /dev/vg_test_01/lv_test_01.
WARNING: ext4 signature detected on /dev/vg_test_01/lv_test_01 at offset 1080. Wipe it? [y/n]: y
  Wiping ext4 signature on /dev/vg_test_01/lv_test_01.
  Logical volume "lv_test_01" created.
```

#### lv 的移除

```
[root@centos7 ~]$ lvremove  /dev/vg_test_01/lv_test_01   
# 这个移除我们上面创建lv_test_01这个逻辑卷， 下面提示这个是活动的逻辑卷，输入y就可以了
Do you really want to remove active logical volume vg_test_01/lv_test_01? [y/n]: y
  Logical volume "lv_test_01" successfully removed
```

注意： 如果这个 lv 被挂载了。 请先 umount

#### 挂载文件系统

```
[root@centos7 ~]$ lvcreate -L 2G  -n lv_test_01 vg_test_01                             # 上面我们删除了lv,这里需要创建出来
  Logical volume "lv_test_01" created.
[root@centos7 ~]$ mkfs.ext4  /dev/vg_test_01/lv_test_01                                  # 这里我使用ext4 文件系统了。centos7默认使用的文件系统是xfs,但是xfs不支持缩减的

[root@centos7 ~]$ mkdir /mnt/test_01                                                    # 创建挂载点目录
[root@centos7 ~]$ mount /dev/vg_test_01/lv_test_01  /mnt/test_01/                       # 挂载逻辑卷
```

## 扩展 LVM

上面我们的测试是 vg 是 4G，我们的创建的 lv 是 2G 的，我们想给创建的 lv 扩展 1G 空间。

```
[root@centos7 ~]$ lvextend -L +1G /dev/vg_test_01/lv_test_01                 # 我们扩大1G， +1G表示在原有基础上扩大1G,我们这里是有vg是有空间的，没有的话就需要创建pv，扩大vg在做
  Size of logical volume vg_test_01/lv_test_01 changed from 2.00 GiB (512 extents) to 3.00 GiB (768 extents).
  Logical volume vg_test_01/lv_test_01 successfully resized.
[root@centos7 ~]$ df -h                                                      # 上面的命令提示lv已经到3G了， 但是使用df-h 查看还是2g
Filesystem                         Size  Used Avail Use% Mounted on
/dev/sda3                           48G  4.9G   41G  11% /
devtmpfs                           979M  4.0K  979M   1% /dev
tmpfs                              993M     0  993M   0% /dev/shm
tmpfs                              993M   22M  971M   3% /run
tmpfs                              993M     0  993M   0% /sys/fs/cgroup
/dev/sda1                          976M  130M  780M  15% /boot
/dev/sda5                           20G  307M   18G   2% /app
tmpfs                              199M   32K  199M   1% /run/user/0
/dev/sr0                           8.1G  8.1G     0 100% /run/media/root/CentOS 7 x86_64
/dev/mapper/vg_test_01-lv_test_01  2.0G   33M  2.0G   2% /mnt/test_01
[root@centos7 ~]$ resize2fs /dev/mapper/vg_test_01-lv_test_01              # 需要增长下文件系统的，让文件系统和lv大小匹配下
meta-data=/dev/mapper/vg_test_01-lv_test_01 isize=512    agcount=4, agsize=131072 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=0 spinodes=0
data     =                       bsize=4096   blocks=524288, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
log      =internal               bsize=4096   blocks=2560, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
data blocks changed from 524288 to 786432
[root@centos7 ~]$ df -h                                                    # 再次查看就是一致的了
Filesystem                         Size  Used Avail Use% Mounted on
/dev/sda3                           48G  4.9G   41G  11% /
devtmpfs                           979M  4.0K  979M   1% /dev
tmpfs                              993M     0  993M   0% /dev/shm
tmpfs                              993M   22M  971M   3% /run
tmpfs                              993M     0  993M   0% /sys/fs/cgroup
/dev/sda1                          976M  130M  780M  15% /boot
/dev/sda5                           20G  307M   18G   2% /app
tmpfs                              199M   32K  199M   1% /run/user/0
/dev/sr0                           8.1G  8.1G     0 100% /run/media/root/CentOS 7 x86_64
/dev/mapper/vg_test_01-lv_test_01  3.0G   33M  3.0G   2% /mnt/test_01
```

注意：

1. 　　 ext 系列可以使用 resieze2fs 去调整。其他的文件系统可以参考 [http://tldp.org/HOWTO/LVM-HOWTO/extendlv.html](http://tldp.org/HOWTO/LVM-HOWTO/extendlv.html)
2. 　　 lvextentd 有个 - r 选项，自动去调整大小，匹配 lv 和文件系统大小的。

## 缩减 LVM

逻辑卷的大小可以减小，也可以增加。 但是，在缩小卷本身之前，请记住缩小文件系统的大小或存在于卷中的任何文件是非常重要的，否则可能会丢失数据。

注意： xfs,jsf 文件系统是没法缩减 lvm 的，因为这 2 个文件系统没法缩减文件系统大小的。参考 [http://tldp.org/HOWTO/LVM-HOWTO/reducelv.html](http://tldp.org/HOWTO/LVM-HOWTO/reducelv.html)

主要步骤：

1. 　　检查空间使用情况和分析
2. 　　umount 设备
3. 　　缩减文件系统大小
4. 　　缩减 lv 大小
5. 　　恢复挂载设备

上面我们的逻辑卷是 3G 的大小，在缩减之前我们需要确保缩减的空间不能影响数据的存放的。

检查工作

```
[root@centos7 ~]$ cp -a /etc/ /mnt/test_01/                              # 我这里模拟下，只能目录有文件的情况 
[root@centos7 ~]$ du -sh /mnt/test_01/                                   # 查看下大小
42M    /mnt/test_01/
[root@centos7 ~]$ df -h                                                   # 查看逻辑卷分区利用情况 ，数据才存放76M,我们的逻辑卷都3G呢， 如果我们想缩减1G,完全没有问题的。
Filesystem                         Size  Used Avail Use% Mounted on
/dev/sda3                           48G  4.9G   41G  11% /
devtmpfs                           979M  4.0K  979M   1% /dev
tmpfs                              993M     0  993M   0% /dev/shm
tmpfs                              993M   22M  971M   3% /run
tmpfs                              993M     0  993M   0% /sys/fs/cgroup
/dev/sda1                          976M  130M  780M  15% /boot
/dev/sda5                           20G  307M   18G   2% /app
tmpfs                              199M   32K  199M   1% /run/user/0
/dev/sr0                           8.1G  8.1G     0 100% /run/media/root/CentOS 7 x86_64
/dev/mapper/vg_test_01-lv_test_01  3.0G   76M  3.0G   3% /mnt/test_01
```

```
[root@centos7 ~]$ umount /dev/vg_test_01/lv_test_01                           # 取消挂载
[root@centos7 ~]$ resize2fs  /dev/vg_test_01/lv_test_01  1G                   # resieze2fs定义下文件系统大小
resize2fs 1.42.9 (28-Dec-2013)
Please run 'e2fsck -f /dev/vg_test_01/lv_test_01' first.

[root@centos7 ~]$ e2fsck -f /dev/vg_test_01/lv_test_01                        #上面的命令要检查，那就检查下
e2fsck 1.42.9 (28-Dec-2013)
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
/dev/vg_test_01/lv_test_01: 3614/196608 files (0.1% non-contiguous), 42361/786432 blocks
[root@centos7 ~]$ resize2fs  /dev/vg_test_01/lv_test_01  1G                   # 检查完，那就执行缩减文件系统大小
resize2fs 1.42.9 (28-Dec-2013)
Resizing the filesystem on /dev/vg_test_01/lv_test_01 to 262144 (4k) blocks.
The filesystem on /dev/vg_test_01/lv_test_01 is now 262144 blocks long.
[root@centos7 ~]$ lvreduce  -L 1G /dev/vg_test_01/lv_test_01                  # 缩减下逻辑卷到1G，这里有提示，缩减可能会丢失数据，输入y即可
  WARNING: Reducing active logical volume to 1.00 GiB.
  THIS MAY DESTROY YOUR DATA (filesystem etc.)
Do you really want to reduce vg_test_01/lv_test_01? [y/n]: yG               
  Size of logical volume vg_test_01/lv_test_01 changed from 3.00 GiB (768 extents) to 1.00 GiB (256 extents).
  Logical volume vg_test_01/lv_test_01 successfully resized.
[root@centos7 ~]$ mount /dev/vg_test_01/lv_test_01  /mnt/test_01/            # 恢复挂载
[root@centos7 ~]$ ll /mnt/test_01/
total 28
drwxr-xr-x. 140 root root 12288 Dec  7 13:54 etc
drwx------.   2 root root 16384 Dec  7 15:47 lost+found
[root@centos7 ~]$ df -h                                                     # 检查下
Filesystem                         Size  Used Avail Use% Mounted on
/dev/sda3                           48G  4.9G   41G  11% /
devtmpfs                           979M  4.0K  979M   1% /dev
tmpfs                              993M     0  993M   0% /dev/shm
tmpfs                              993M   22M  971M   3% /run
tmpfs                              993M     0  993M   0% /sys/fs/cgroup
/dev/sda1                          976M  130M  780M  15% /boot
/dev/sda5                           20G  307M   18G   2% /app
tmpfs                              199M   32K  199M   1% /run/user/0
/dev/sr0                           8.1G  8.1G     0 100% /run/media/root/CentOS 7 x86_64
/dev/mapper/vg_test_01-lv_test_01  944M   52M  825M   6% /mnt/test_01
```

## 迁移 LVM 的 vg

移动 vg 到另外一个机器上

主要步骤：

1. 　　检查和分析
2. 一些预处理工作
3. umount 文件系统
4. 　　设置卷组非活动
5. 　　导出卷组
6. 　　取出设备，插入到新机器
7. 　　导入卷组
8. 　　激活卷组
9. 　　挂载文件系统

检查分析

```
[root@centos7 ~]$ vgs
  VG         #PV #LV #SN Attr   VSize VFree
  vg_test_01   4   1   0 wz--n- 3.98g 2.98g
[root@centos7 ~]$ pvs
l  PV         VG         Fmt  Attr PSize    PFree   
  /dev/sdb1  vg_test_01 lvm2 a--  1020.00m       0 
  /dev/sdb2             lvm2 ---     1.00g    1.00g
  /dev/sdc1  vg_test_01 lvm2 a--  1020.00m 1016.00m
  /dev/sdc2             lvm2 ---     1.00g    1.00g
  /dev/sdd1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sdd2             lvm2 ---     5.00g    5.00g
  /dev/sde1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sde2             lvm2 ---     2.00g    2.00g
[root@centos7 ~]$ lvs
  LV         VG         Attr       LSize Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lv_test_01 vg_test_01 -wi-ao---- 1.00g
```

我们使用 lvs,vgs,pvs 分别查看信息。发现我们 vg 是 3G 的大小。lv 是 1G 的大小。但是 vg 的 pv 来自不同的磁盘的。我们要迁移 vg。不能把包含 pv 都迁移过去把。 那这一下子需要 4 个盘的。

我们把 pv 数据迁移下，到时候摘盘的时候只那一个就可以多好。 发现 / dev/sdd2 是一个 5G 的盘。 打算使用 / dev/sdd 这个盘作为迁移盘来迁移数据。

一些预处理工作

```
[root@centos7 ~]$ umount /mnt/test_01/                                    # 去除挂载
```

```
[root@centos7 ~]$ vgchange  -an vg_test_01                                # 设置vg不激活
  0 logical volume(s) in volume group "vg_test_01" now active
```

```
[root@centos7 ~]$ pvmove /dev/sd{b1,c1,e1}                                 # 迁移pv数据
  /dev/sdb1: Moved: 0.00%
  /dev/sdb1: Moved: 100.00%
[root@centos7 ~]$ pvs                                                      # 确保pv都是空的，没有数据存放了。
  PV         VG         Fmt  Attr PSize    PFree   
  /dev/sdb1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sdb2             lvm2 ---     1.00g    1.00g
  /dev/sdc1  vg_test_01 lvm2 a--  1020.00m 1016.00m
  /dev/sdc2             lvm2 ---     1.00g    1.00g
  /dev/sdd1  vg_test_01 lvm2 a--  1020.00m       0 
  /dev/sdd2  vg_test_01 lvm2 a--    <5.00g   <5.00g
  /dev/sde1  vg_test_01 lvm2 a--  1020.00m 1020.00m
  /dev/sde2             lvm2 ---     2.00g    2.00g

[root@centos7 ~]$ vgreduce vg_test_01  /dev/sd{b1,c1,e1}                   # 缩减vg 去除b1,c1,e1
  Removed "/dev/sdb1" from volume group "vg_test_01"
  Removed "/dev/sdc1" from volume group "vg_test_01"
  Removed "/dev/sde1" from volume group "vg_test_01"
[root@centos7 ~]$ pvremove /dev/sd{b1,c1,e1}                               # 移除pv，这里提示，
  Lables on physical volume "/dev/sdb1" sucdessfully wiped.
  Labels on physical volume "/dev/sdc1" successfully wiped.
  Labels on physical volume "/dev/sde1" successfully wiped.
```

导出 vg

```
[root@centos7 ~]$ vgdisplay                                       # 导出前的确认
  --- Volume group ---
  VG Name               vg_test_01
  System ID           
  Format                lvm2
  Metadata Areas        2
  Metadata Sequence No  24
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                1
  Open LV               0
  Max PV                0
  Cur PV                2
  Act PV                2
  VG Size               5.99 GiB
  PE Size               4.00 MiB
  Total PE              1534
  Alloc PE / Size       256 / 1.00 GiB
  Free  PE / Size       1278 / 4.99 GiB
  VG UUID               sZwHea-LabA-SJaV-Wz40-qFp3-Um2w-pvmJAY
   
[root@centos7 ~]$ vgexport vg_test_01                                    # 导出vg发现有激活的设备，需要关闭
  Volume group "vg_test_01" has active logical volumes
[root@centos7 ~]$ vgchange -an vg_test_01                                # 设置为非激活
　　0 logical volume(s) in volume group "vg_test_01" now active
[root@centos7 ~]$ vgexport vg_test_01                                    # 导出， 要看到成功导出才可以，这里注意了， 如果这个vg名字和目标机器有重名的话， 这里使用rename改下在导出
　　Volume group "vg_test_01" successfully exported

[root@centos7 ~]$ sync                                                   # 多执行几次sync。 防止内存和磁盘没有同步的问题。
[root@centos7 ~]$ sync
[root@centos7 ~]$ sync
[root@centos7 ~]$ sync
```

我这里把这个磁盘取出来安装到另外一个机器上面。下面的一部分操作在新机器上执行。注意啦。

识别硬件

```
[root@centos6 ~]$ /git/Bash/other/scan_scsi_device.sh                             # 执行下扫描硬件脚本，我自己写的，后面把这个bash脚本贴出来
start scan
/sys/devices/pci0000:00/0000:00:07.1/host0/scsi_host/host0/scan scan finished.
/sys/devices/pci0000:00/0000:00:07.1/host1/scsi_host/host1/scan scan finished.
/sys/devices/pci0000:00/0000:00:10.0/host2/scsi_host/host2/scan scan finished.
end  scan
please use lsblk check
[root@centos6 ~]$ lsblk                                                           # 使用lsblk查看，可以发现，识别出来就是那个/dev/sdc
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sr0     11:0    1  3.7G  0 rom  /media/CentOS_6.9_Final
sr1     11:1    1  8.1G  0 rom  /media/CentOS 7 x86_64
sda      8:0    0  200G  0 disk 
├─sda1   8:1    0    1G  0 part /boot
├─sda2   8:2    0 48.8G  0 part /
├─sda3   8:3    0 19.5G  0 part /app
├─sda5   8:5    0    2G  0 part [SWAP]
├─sda4   8:4    0    2M  0 part 
└─sda6   8:6    0    1G  0 part 
sdb      8:16   0  100G  0 disk 
├─sdb1   8:17   0    1G  0 part 
├─sdb2   8:18   0   20G  0 part 
├─sdb3   8:19   0    1G  0 part 
├─sdb4   8:20   0    1K  0 part 
├─sdb5   8:21   0   20G  0 part 
├─sdb6   8:22   0    1G  0 part 
└─sdb7   8:23   0    1G  0 part 
sr2     11:2    1  3.7G  0 rom  /media/CentOS_6.9_Final_
sr3     11:3    1    2G  0 rom  /media/CentOS_6.9_Final__
sdc      8:32   0   20G  0 disk 
├─sdc1   8:33   0    1G  0 part 
└─sdc2   8:34   0    5G  0 part
```

脚本内容如下

```
[root@centos6 ~]$ cat /git/Bash/other/scan_scsi_device.sh 
#!/bin/bash
#================================================
#FileName   :scan_scsi_device
#Author     :zhaojiedi
#Description:如果你添加了一个新的硬盘设备， 但是没有被系统识别，使用如下脚本可以识别出来， 
#DateTime   :2017-11-30 18:03:27
#Version    :V1.0
#Other      :最新版本建议从这里获取https://github.com/zhaojiedi1992/Bash
#================================================
#!/bin/bash
echo "start scan"
for i in `find /sys/devices/ -name scan`; do 
    echo "- - -" > $i
    echo  $i scan finished.
done
echo "end  scan"
echo -e "\033[32mplease use lsblk check\033[0m"
```

导入并挂载

```
[root@centos6 ~]$ vgscan                                               # vg扫描
  Reading all physical volumes.  This may take a while...
  Found exported volume group "vg_test_01" using metadata type lvm2
[root@centos6 ~]$ pvscan                                               # pv扫描
  PV /dev/sdc1    is in exported VG vg_test_01 [1020.00 MiB / 0    free]
  PV /dev/sdc2    is in exported VG vg_test_01 [5.00 GiB / 4.99 GiB free]
  Total: 2 [5.99 GiB] / in use: 2 [5.99 GiB] / in no VG: 0 [0   ]
[root@centos6 ~]$ vgimport vg_test_01                                  # 确认无错误的就导入。
  Volume group "vg_test_01" successfully imported
[root@centos6 ~]$ vgs                                                  # 查看下vg信息
  VG         #PV #LV #SN Attr   VSize VFree
  vg_test_01   2   1   0 wz--n- 5.99g 4.99g
[root@centos6 ~]$ vgchange -ay vg_test_01                              # 激活vg
  1 logical volume(s) in volume group "vg_test_01" now active
[root@centos6 ~]$ mkdir /mnt/new_test                                  # 创建挂载点
[root@centos6 ~]$ mount /dev/vg_test_01/lv_test_01  /mnt/new_test/     # 挂载
[root@centos6 ~]$ du -sh /mnt/new_test/                                # 确认文件没有丢失
45M    /mnt/new_test/
```

## 快照 LVM

分析下当前环境，我把 vg 移动到 centos6 上了。一下操作在 centos6 上执行的。

```
[root@centos6 ~]$ vgs                                        # 查看下vg信息， 一共6G,还有5G呢。
  VG         #PV #LV #SN Attr   VSize VFree
  vg_test_01   2   1   0 wz--n- 5.99g 4.99g
[root@centos6 ~]$ pvs                                       # 有2个pv
  PV         VG         Fmt  Attr PSize    PFree
  /dev/sdc1  vg_test_01 lvm2 a--u 1020.00m    0 
  /dev/sdc2  vg_test_01 lvm2 a--u    5.00g 4.99g
```

我们刚才给 / mnt/new_test 目录挂载逻辑卷 vg_test_01。假如我们的 / mnt/new_test 的内容一直在变化。想去备份数据就需要快照卷了。

创建快照

```
[root@centos6 etc]$ lvcreate  -L 500M -s -p r -n vg_test_01_snapshot /dev/vg_test_01/lv_test_01       # -L指定大小， -s 表示创建快照而不是普通逻辑卷，-p r 指定权限为只读的， -n指定名字
  Logical volume "vg_test_01_snapshot" created.
```

注意： 如果使用的 xfs 文件系统， 挂载的时候需要加入 nouuid,ro 选项，且创建快照的时候不能指定 - p r 选项。具体参考： [http://tldp.org/HOWTO/LVM-HOWTO/snapshots_backup.html](http://tldp.org/HOWTO/LVM-HOWTO/snapshots_backup.html)

模拟一些数据修改操作

```
[root@centos6 etc]$ echo "zhaojiedi1992" >>/mnt/new_test/zhaojiedi1992.txt                            # 制作一些修改情况
[root@centos6 etc]$ vim /mnt/new_test/etc/motd
```

监控快照情况

```
[root@centos6 ~]$ lvdisplay  /dev/vg_test_01/vg_test_01_snapshot 
  --- Logical volume ---
  LV Path                /dev/vg_test_01/vg_test_01_snapshot
  LV Name                vg_test_01_snapshot
  VG Name                vg_test_01
  LV UUID                pZ8x2u-lqPA-uLef-P816-dS8V-wZ0y-PKWWwL
  LV Write Access        read only                                         #只读的
  LV Creation host, time centos6.magedu.com, 2017-12-02 06:11:56 +0800
  LV snapshot status     active destination for lv_test_01                 # 这是lv_test_01的快照
  LV Status              available
 # open                 0
  LV Size                1.00 GiB                                          # 快照的总大小
  Current LE             256
  COW-table size         500.00 MiB
  COW-table LE           125
  Allocated to snapshot  0.01%                                             # 这个地方可以看当前快照占用情况。 
  Snapshot chunk size    4.00 KiB
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:3
```

挂载快照并备份

```
[root@centos6 etc]$ mkdir /mnt/test_bak                                            # 创建一个快照挂载目录
[root@centos6 etc]$ mount /dev/vg_test_01/vg_test_01_snapshot  /mnt/test_bak/      # 挂载，因为我们上面创建快照的时候指定-pr只读的
mount: block device /dev/mapper/vg_test_01-vg_test_01_snapshot is write-protected, mounting read-only
[root@centos6 etc]$ cat /mnt/test_bak/                                             # 快照后的zhaojiedi1992.txt没有的。
etc/        lost+found/ 
[root@centos6 etc]$ cat /mnt/test_bak/etc/motd                                     # 这个地方的文件也是快照前的样子。没有问题
Welcom you this system
[root@centos6 etc]$ tar -jcvf /root/test.tar.bz --acl --selinux  --xattrs /mnt/test_bak/   # 备份数据赶紧的
```

移除快照

```
[root@centos6 etc]$ umount /mnt/test_bak/                                    # 取消挂载
[root@centos6 etc]$ lvremove /dev/vg_test_01/vg_test_01_snapshot             # 移除了快照卷
Do you really want to remove active logical volume vg_test_01_snapshot? [y/n]: y
  Logical volume "vg_test_01_snapshot" successfully removed
```

## 参考资料

redhat : [https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/installation_guide/create_lvm-x86](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/installation_guide/create_lvm-x86)

suse : [https://www.suse.com/documentation/sles11/stor_admin/data/lvm.html](https://www.suse.com/documentation/sles11/stor_admin/data/lvm.html)

lvm how to : [http://tldp.org/HOWTO/LVM-HOWTO/index.html](http://tldp.org/HOWTO/LVM-HOWTO/index.html)
