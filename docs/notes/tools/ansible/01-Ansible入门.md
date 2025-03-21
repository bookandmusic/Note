---
title: 01-Ansible入门
createTime: 2025/03/21 22:12:18
permalink: /ansible/9y3qi2zo/
---
## Ansible概念

### 介绍

Ansible是一款为类Unix系统开发的自由开源的配置和自动化工具。

它用Python写成，类似于`saltstack`和`Puppet`，但是有一个不同和优点是我们不需要在节点中安装任何客户端。

它使用`SSH`来和节点进行通信。Ansible基于 `Python paramiko` 开发，分布式，无需客户端，轻量级，配置语法使用 `YMAL` 及 `Jinja2`模板语言，更强的远程命令执行操作。

### 特点

- 部署简单，没有客户端，只需在主控端部署Ansible环境，被控端无需做任何操作；
- 模块化：调用特定的模块，完成特定任务
- 默认使用SSH协议对设备进行管理；
- 主从集中化管理；
- 配置简单、功能强大、扩展性强；
- 支持API及自定义模块，可通过Python轻松扩展；
- 通过`Playbooks`来定制强大的配置、状态管理
- 对云计算平台、大数据都有很好的支持；
- 具有幂等性：一个操作在一个主机上执行一遍和执行N遍的结果是一样的

> ansible是基于模块工作的，本身没有批量部署的能力。真正具有批量部署的是ansible所运行的模块，ansible只是提供一种框架。

**主要包括**

- `Ansible`： ansible的核心模块
- `Host Inventory`：主机清单，也就是被管理的主机列表
- `Playbooks`：ansible的剧本，可想象为将多个任务放置在一起，一块执行
- `Core Modules`：ansible的核心模块
- `Custom Modules`：自定义模块
- `Connection Plugins`：连接插件，用于与被管控主机之间基于SSH建立连接关系
- `Plugins`：其他插件，包括记录日志等

### 安装

直接使用python的包管理工具`pip`安装

```shell
pip install ansible
```

如果系统中没有pip，则可以使用系统自带的包管理工具安装，不同系统需要具体区分。

## Ad-Hoc

利用ansible命令直接完成管理,主要用于临时命令使用场景

### help

`ansible-doc`：显示模块帮助的指令

**格式**

`ansible-doc [参数] [模块...]`

**常用参数**
`ansible-doc 模块名称` ： 列出模块帮助
`ansible-doc -l` ： 列出可用模块
`ansible-doc -s` ： 显示指定模块的playbook片段

### command

**格式**

`ansible 清单 -m 模块 -a 模块参数`

**常用参数**

|常用参数|含义|
| ---------------------| ------------------------------------|
|–version|显示版本|
|-m module|指定模块, 默认为 command 模块|
|-v|详细过程 -vv -vvv 更详细过程|
|–list|显示主机列表, 也可以用–list-hosts|
|-k|提示输入 ssh 连接密码, 默认 key 认证|
|-C|预执行检测|
|-T|执行命令的超时时间, 默认 10s|
|-u|指定远程执行的用户|
|-b|执行 sudo 切换身份操作|
|-become-user=USERNAME|指定 sudo 的用户|
|-K|提示输入 sudo 密码|

**颜色含义**

|颜色|含义|
| ----| --------------------------------|
|绿色|执行成功但为对远程主机做任何改变|
|黄色|执行成功并对远程主机做改变|
|红色|执行失败|

### 示例

help命令示例：

```shell
🔋97% 🕙[ 22:10:45 ] ➜  ansible-doc -s ping
- name: Try to connect to host, verify a usable python and return `pong' on success
  ping:
      data:                  # Data to return for the `ping' return value. If this parameter is set to `crash', the module will cause an
                             # exception.
```

执行命令示例：

```shell
🔋97% 🕙[ 21:00:09 ] ➜  ansible 127.0.0.1 -m ping
[WARNING]: No inventory was parsed, only implicit localhost is available
127.0.0.1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

## Inventory

Ansible 设计之初，就是用来批量管理主机的，而Ansible 是通过读取 `Inventory` 中的配置知道我们要对哪些机器变更。 虽然你可以在命令行使用 ad-hoc 临时命令时指定 IP 地址的方式来控制要操作的对象，但如果想充分使用 Ansible 的灵活性和或扩展性，你必须掌握 `Inventory` 的配置。

默认的文件路径为：`/etc/ansible/hosts`

`Inventory` 文件可以有多种格式，取决于你使用什么插件，最常用的格式是 `YAML` 和 `INI`

### Inventory 分组

如下为 `INI` 格式的示例:

> 括号中的标题是组名，用于对主机进行分类，用于确定什么时间、什么目的、相对哪些主机做什么事情

```ini
[sqlnodes]
192.168.0.101
192.168.0.102
192.168.0.103

[datanodes]
192.168.0.201
192.168.0.202
192.168.0.203
```

如下为 `YAML` 格式的示例:

```yaml
all:
  databases:
    masters:
      hosts:
       - 192.168.0.101
    slaves:
      hosts:
        - 192.168.0.102
        - 192.168.0.103
```

默认有两个分组： `all` and `ungrouped` 。 `all` 组顾名思义包括所有主机。 `ungrouped` 则是 `all` 组之外所有主机。所有的主机要不属于 `all` 组，要不就属于 `ungrouped` 组。

尽管 `all` 和 `ungrouped` 始终存在，但它们以隐式的方式出现，而不出现在诸如 `group_names` 的组列表中。

> 如果有许多具有相似模式的主机，则可以将它们添加为一个范围，而不必分别列出每个主机名：

In INI:

```ini
[databases]
192.168.0.10[0-9]
```

In YAML:

```yaml
...
  databases:
    hosts:
      192.168.0.10[0-9]
```

对于数字匹配 [0-9], 也支持字母正则 [a-z]：

```ini
[databases]
db-[a:f].example.com
```

### Inventory 变量

> 主机清单常用变量

|参数|用途|例子|
| ----| -----------------------------------------| ----|
|`ansible_ssh_host`|定义 hosts ssh 地址|`ansible_ssh_host=192.168.81.220`|
|`ansible_ssh_port`|定义 hosts 端口号也可以在 ip 后面加: 定义|`ansible_ssh_prrot=666`|
|`ansibe_ssh_user`|定义 hosts ssh 认证用户|`ansible_ssh_user=user`|
|`ansible_ssh_pass`|定义 hosts ssh 认证密码|`ansible_ssh_pass=redhat`|
|`ansibe_sudo`|定义 hosts sudo 用户|`ansible_sudo=root`|
|`ansibe_sudo_pass`|定义 hosts sudo 用户的认证密码|`ansible_sudo_pass=aaaaaa`|
|`ansibe_sudo_exe`|定义 sudo 命令的路径|`ansible_sudo_exe=/usr/bin/sudo`|
|`ansible_coneection`|定义 hosts 连接方式|`ansible_connection=ssh`|
|`ansible_ssh_private_key_file`|定义 hosts 私钥|`ansible_ssh_private_key_file=/root/key`|
|`ansible_ssh_shell_tyep`|定义 hosts shell 类型|`ansible_ssh_shell_type=bash`|
|`ansible_python_interpreter`|定义 hosts 任务执行 python 路径|`ansible_python_interpreter=/usr/bin/python2.6`|
|`ansbile_*_interpreter`|定义 hosts 解析其他语言路径|`ansible_*_interpreter=/usr/bin/ruby`|

> 给单台主机设置变量 : `host variables`

```INI
[targets]

localhost                          ansible_connection=local
192.168.0.101  ansible_port=5555   ansible_connection=ssh        ansible_user=root
192.168.0.102:5555  ansible_connection=ssh        ansible_user=root
```

给 `host` 添加非标准 SSH 端口，把端口直接添加到主机名后，冒号分隔即可； 当然也可以使用变量主动指定

> 给多台主机设置变量 : `group variables`

如果组中的所有主机共享一个变量值，则可以一次将该变量应用于整个组

```INI
[targets]
192.168.0.10[1-3]

[targets:vars]
ansible_port=5555   
ansible_connection=ssh        
ansible_user=root
```

组变量是一次将变量同时应用于多个主机的便捷方法。 但是，在执行之前，Ansible始终将变量（包括 Inventory 清单变量）展平到主机级别。 如果该主机是多个组的成员，则 Ansible 将从所有这些组中读取变量值。 如果同一主机在不同的组中被赋予不同的变量值，则 Ansible 会根据内部规则来选择要使用的值。

优先顺序是（从最低到最高）：

- all group (because it is the ‘parent’ of all other groups)
- parent group
- child group
- host

> 嵌套组的组变量设置

```INI
[sqlnodes]
192.168.0.101
192.168.0.102
192.168.0.103

[datanodes]
192.168.0.201
192.168.0.202
192.168.0.203

[database:children]
sqlnodes
datanodes

[database:vars]
ansible_port=19999   
ansible_connection=ssh        
ansible_user=admin
manage_user=admin

[sqlnodes:vars]
port=3306

[datanodes:vars]
port=3316
```

> - 子组成员默认属于父组成员
> - 子组的变量比父组的变量优先级高，即值会覆盖父组的变量。
> - 组可以有多个父组或孩子，但不能循环关系。
> - 主机也可以隶属于多个组中，但是只有 **一个** 主机实例，可以合并多个组中的数据。

### 示例

> 指定inventory配置文件中的主机组执行命令

`inventory.ini`配置

```INI
[test1]
host1 ansible_ssh_host=172.17.140.101 ansible_ssh_user="root" ansible_ssh_pass="QWer12#$" ansible_ssh_port=22
```

对主机组中的所有主机执行`ping`命令

```INI
🔋97% 🕙[ 22:12:51 ] ➜  ansible test1  -i inventory.ini -m ping
host1 | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python"
    },
    "changed": false,
    "ping": "pong"
}
```

对主机组中的所有主机执行`lsblk`命令

```shell
🔋97% 🕙[ 22:17:18 ] ➜  ansible test1 -i inventory.ini -m shell -a "lsblk"
host1 | CHANGED | rc=0 >>
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
vda    254:0    0 59.6G  0 disk
└─vda1 254:1    0 59.6G  0 part /etc/hosts
```

> 对子主机组中的主机执行命令

`inventory.ini`配置

```ini
; hosts 组应包含所有安装MySQL数据库的主机 IP
[hosts]
host1 ansible_ssh_host=172.16.70.104 ansible_ssh_user="root" ansible_ssh_pass="aaaaaa" ansible_ssh_port=22

; define databases
[databases]
database_1 ansible_host=172.16.70.104 port=3306 manage_user="root" mysql_password="!QAZ2wsx"
```

对数据库实例`database_1`执行SQL语句时，会连接`hosts` 分组中的`172.17.140.101:19999` 主机，并且我们在命令中可以通过 `Jinja2`语法使用变量。

```shell
🔋97% 🕙[ 22:36:20 ] ➜  ansible database_1 -i inventory.ini -m shell -a "/usr/local/bin/mysql -u'{{manage_user}}' -p'{{mysql_password}}' -e 'show databases'"
[WARNING]: Platform darwin on host database_1 is using the discovered Python interpreter at /usr/bin/python3, but future installation of
another Python interpreter could change the meaning of that path. See https://docs.ansible.com/ansible-
core/2.14/reference_appendices/interpreter_discovery.html for more information.
database_1 | CHANGED | rc=0 >>
Database
information_schema
mysql
performance_schema
sysmysql: [Warning] Using a password on the command line interface can be insecure.
```

## playbook

以下内容摘自ansible官网：

> Ansible Playbook 是什么？

Ansible® Playbook 是设定自动化任务的一种蓝图，可在无需人工干预或有限干预的前提下执行复杂的 IT 操作。Ansible Playbook 对一组或一类共同构成 Ansible 清单的主机执行。

> Ansible Playbook 的工作原理是什么？

Ansible 模块执行任务。一个或多个 Ansible 任务可以合并为一个 play。两个或更多 play 可以合并为一个 Ansible Playbook。Ansible Playbook 是一个对主机自动执行的任务列表。主机的群组可以构成 Ansible 库存清单。

Ansible Playbook 内的每个模块都执行一项具体的任务。每个模块内的元数据将决定执行任务的时间和地点，以及执行的用户。

### 实例

```yaml
---
- name: show mysql version
  hosts: databases
  tasks:
    - name: execute cmd to mysql version
      shell:
        cmd: "/usr/local/bin/mysql --version"
      register: version
    
    - name: show version
      debug:
        msg: "{{version.stdout}}"

- name: show mysql databases
  hosts: databases
  tasks:
    - name: execute sql to databases
      shell: 
        cmd: "/usr/local/bin/mysql -u'{{manage_user}}' -p'{{mysql_password}}' -e 'show databases'"
      register: databases
    
    - name: show databases
      debug:
        msg: "{{databases.stdout_lines}}"
```

该playbook中包含两个play：

- 第一个play检查mysql版本，并输出信息
- 第二个play执行SQL语句，并输出当前MySQL实例的所有数据库

该每个play中有一些变量：

- `name`：当前任务的名字
- `hosts`：该play任务执行的主机组，当然 此时的databases主机组即前面的inventory文件中配置的主机组
- `tasks`：该play中需要执行的具体任务

`shell`、`debug`模块都是ansible内置的模块，后面会对一些常用的模块简单说明

### roles

从上面的例子中，可以看出`tasks`是一个任务列表。由此，引出两个问题：

- 当`tasks`列表中的任务过多时，则会导致整个playbook过于复杂，庞大，不好维护
- 当`tasks`列表中的某些任务需要在多个playbook中使用时，需要在多个`playbook`中重复编写，则会导致多个`playbook`间代码的冗余

为了解决这些问题，ansible提供了一种更好的组织 `playbook` 的方式： `roles`

现在可以将上面的`playbook`借助`roles`重新组织：

> 项目结构

```shell
🔋97% 🕙[ 19:10:35 ] ➜  tree .
.
├── inventory.ini
├── main.yaml
└── roles
    ├── check_version
    │   └── tasks
    │       └── main.yaml
    └── show_databases
        └── tasks
            └── main.yaml

6 directories, 5 files
```

> `roles/show_databases/tasks/main.yaml`

```shell
---

- name: execute cmd to mysql version
  shell:
    cmd: "/usr/local/bin/mysql --version"
  register: version

- name: show version
  debug:
    msg: "{{version.stdout}}"

```

> `roles/check_version/tasks/main.yaml`

```shell
---

- name: execute sql to databases
  shell: 
    cmd: "/usr/local/bin/mysql -u'{{manage_user}}' -p'{{mysql_password}}' -e 'show databases'"
  register: databases

- name: show databases
  debug:
    msg: "{{databases.stdout_lines}}"

```

> `main.yaml`

```yaml
---

- name: show mysql version
  hosts: databases
  roles:
    - {
      role: check_version,
      tags: check_version,
    }

- name: show mysql databases
  hosts: databases
  roles:
    - {
      role: show_databases,
      tags: show_databases,
    }

```

### 常用命令

#### 查看脚本影响到的 hosts

下面这条命令，指定 inventory 文件，列出 hosts 列表，并不会去执行定义的 tasks，观察 host 是否配置正确很有用：

```shell
🔋97% 🕙[ 19:20:30 ] ➜  ansible-playbook -i inventory.ini main.yaml --list-hosts

playbook: main.yaml

  play #1 (databases): show mysql version       TAGS: []
    pattern: ['databases']
    hosts (1):
      database_1

  play #2 (databases): show mysql databases     TAGS: []
    pattern: ['databases']
    hosts (1):
      database_1

```

#### 测试语法是否正确

如果检查没问题，那么就会输出被检查的文件名

```shell
🔋97% 🕙[ 19:32:40 ] ➜  ansible-playbook -i inventory.ini --syntax-check  main.yaml 

playbook: main.yaml
```

如果存在语法错误，则会输出错误信息

```shell
🔋97% 🕙[ 19:41:10 ] ➜  ansible-playbook -i inventory.ini --syntax-check main.yaml 
ERROR! 'role' is not a valid attribute for a Play

The error appears to be in '~/ansible/main.yaml': line 3, column 3, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:


- name: show mysql version
  ^ here
```

#### 测试执行

模拟执行，主要用于排错,不会产生实际影响

```shell
🔋97% 🕙[ 19:45:21 ] ➜  ansible-playbook -i inventory.ini -C main.yaml

PLAY [show mysql version] ***********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
[WARNING]: Platform darwin on host database_1 is using the discovered Python interpreter at /usr/bin/python3, but future installation of another
Python interpreter could change the meaning of that path. See https://docs.ansible.com/ansible-
core/2.14/reference_appendices/interpreter_discovery.html for more information.
ok: [database_1]

TASK [check_version : execute cmd to mysql version] *********************************************************************************************
skipping: [database_1]

TASK [check_version : show version] *************************************************************************************************************
ok: [database_1] => {
    "msg": ""
}

PLAY [show mysql databases] *********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
ok: [database_1]

TASK [show_databases : execute sql to databases] ************************************************************************************************
skipping: [database_1]

TASK [show_databases : show databases] **********************************************************************************************************
ok: [database_1] => {
    "msg": []
}

PLAY RECAP **************************************************************************************************************************************
database_1                 : ok=4    changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   

```

如果cun'zai

#### 查看输出的细节

> `--verbose`参数也可以简化为 `-v`，如果想要输出更详细的信息，则可以使用多个 `-v`参数，最多支持 `-vvv`

```shell
🔋97% 🕙[ 19:22:10 ] ➜  ansible-playbook -i inventory.ini main.yaml --verbose                 
No config file found; using defaults

PLAY [show mysql version] ***********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
[WARNING]: Platform darwin on host database_1 is using the discovered Python interpreter at /usr/bin/python3, but future installation of another
Python interpreter could change the meaning of that path. See https://docs.ansible.com/ansible-
core/2.14/reference_appendices/interpreter_discovery.html for more information.
ok: [database_1]

TASK [check_version : execute cmd to mysql version] *********************************************************************************************
changed: [database_1] => {"changed": true, "cmd": "/usr/local/bin/mysql --version", "delta": "0:00:00.023217", "end": "2023-03-19 19:22:18.191201", "msg": "", "rc": 0, "start": "2023-03-19 19:22:18.167984", "stderr": "", "stderr_lines": [], "stdout": "/usr/local/bin/mysql  Ver 8.0.32 for macos11.7 on x86_64 (Homebrew)", "stdout_lines": ["/usr/local/bin/mysql  Ver 8.0.32 for macos11.7 on x86_64 (Homebrew)"]}

TASK [check_version : show version] *************************************************************************************************************
ok: [database_1] => {
    "msg": "/usr/local/bin/mysql  Ver 8.0.32 for macos11.7 on x86_64 (Homebrew)"
}

PLAY [show mysql databases] *********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
ok: [database_1]

TASK [show_databases : execute sql to databases] ************************************************************************************************
changed: [database_1] => {"changed": true, "cmd": "/usr/local/bin/mysql -u'root' -p'!QAZ2wsx' -e 'show databases'", "delta": "0:00:00.024684", "end": "2023-03-19 19:22:19.412119", "msg": "", "rc": 0, "start": "2023-03-19 19:22:19.387435", "stderr": "mysql: [Warning] Using a password on the command line interface can be insecure.", "stderr_lines": ["mysql: [Warning] Using a password on the command line interface can be insecure."], "stdout": "Database\ninformation_schema\nmysql\nperformance_schema\nsys", "stdout_lines": ["Database", "information_schema", "mysql", "performance_schema", "sys"]}

TASK [show_databases : show databases] **********************************************************************************************************
ok: [database_1] => {
    "msg": [
        "Database",
        "information_schema",
        "mysql",
        "performance_schema",
        "sys"
    ]
}

PLAY RECAP **************************************************************************************************************************************
database_1                 : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   

```

#### 并行执行脚本

```shell
🔋97% 🕙[ 19:24:47 ] ➜  ansible-playbook -i inventory.ini main.yaml -f 10

PLAY [show mysql version] ***********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
[WARNING]: Platform darwin on host database_1 is using the discovered Python interpreter at /usr/bin/python3, but future installation of another
Python interpreter could change the meaning of that path. See https://docs.ansible.com/ansible-
core/2.14/reference_appendices/interpreter_discovery.html for more information.
ok: [database_1]

TASK [check_version : execute cmd to mysql version] *********************************************************************************************
changed: [database_1]

TASK [check_version : show version] *************************************************************************************************************
ok: [database_1] => {
    "msg": "/usr/local/bin/mysql  Ver 8.0.32 for macos11.7 on x86_64 (Homebrew)"
}

PLAY [show mysql databases] *********************************************************************************************************************

TASK [Gathering Facts] **************************************************************************************************************************
ok: [database_1]

TASK [show_databases : execute sql to databases] ************************************************************************************************
changed: [database_1]

TASK [show_databases : show databases] **********************************************************************************************************
ok: [database_1] => {
    "msg": [
        "Database",
        "information_schema",
        "mysql",
        "performance_schema",
        "sys"
    ]
}

PLAY RECAP **************************************************************************************************************************************
database_1                 : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```
