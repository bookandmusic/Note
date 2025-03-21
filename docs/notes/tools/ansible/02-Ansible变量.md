---
title: 02-Ansible变量
createTime: 2025/03/21 22:12:18
permalink: /ansible/qco729at/
---
我们来说明ansible中变量（不包含role中的变量）用法。

## 命令行变量

在 Ansible 中，我们可以使用 external variables（外部变量）来引入外部定义的变量。通常情况下，我们会将变量定义在 playbook 文件中或者 inventory 文件中，但是如果我们需要在 playbook 执行时动态地传入一些参数或者配置文件中包含了一些需要使用的变量，我们就可以使用 ext_vars 来引入这些变量。

在执行 ansible-playbook 命令时，我们可以使用 `-e` 或者 `--extra-vars` 参数来指定外部变量文件，也可以直接在命令行中使用 `key=value` 的形式指定变量。举个例子，假设我们有一个 playbook 文件，需要使用一个外部变量 `user` 来指定要部署的应用程序的用户，我们可以在命令行中这样使用：

```shell
ansible-playbook myplaybook.yml -e "user=myappuser"
```

这样在 playbook 中就可以使用 `{{ user }}` 来引用这个外部变量了，例如：

```yaml
# myplaybook.yml
---
 - hosts: all
   gather_facts: no
   tasks:
     - name: test external variables
       command: echo {{ user }}
```

我们也可以将变量定义在一个 YAML 格式的文件中，然后通过 `-e` 参数指定这个文件，例如：

```yaml
# vars.yml
user: myappuser
```

```shell
ansible-playbook myplaybook.yml -e "@vars.yml"
```

这样 playbook 中就可以使用 `{{ user }}` 来引用这个外部变量了。

> **注意**:当我们在 playbook 中定义了一个变量，而且同时又使用 `-e` 参数指定了同名的外部变量时，外部变量的值会覆盖 playbook 中的变量值。

## inventory变量

在 Ansible 的 inventory 中，可以定义主机变量、组变量和子组变量。这些变量可以在 playbook 中使用，来实现对主机或主机组的定制化配置。

以以下 inventory 为例：

```ini
[web_servers]
web1 ansible_host=192.168.1.1
web2 ansible_host=192.168.1.2

[db_servers]
db1 ansible_host=192.168.1.3
db2 ansible_host=192.168.1.4

[prod_servers:children]
web_servers
db_servers

[web_servers:vars]
http_port=8080

[db_servers:vars]
db_port=3306

[prod_servers:vars]
app_env=production
```

在这个 inventory 中，我们定义了四个主机：`web1`、`web2`、`db1`、`db2`，并将它们分别归属到了两个组：`web_servers`、`db_servers`。此外，我们还定义了一个父组 `prod_servers`，它包含了 `web_servers` 和 `db_servers` 两个子组。在 `web_servers` 和 `db_servers` 组内，分别定义了变量 `http_port` 和 `db_port`。在 `prod_servers` 组内，定义了变量 `app_env`。

接下来，我们编写一个 playbook，来应用这些变量。

```yaml
---
- name: Start HTTP service
  hosts: web_servers
  become: yes
  tasks:
    - name: Ensure HTTP service is running
      service:
        name: httpd
        state: started
        enabled: yes
      when: "http_port is defined"
        
- name: Start MySQL service
  hosts: db_servers
  become: yes

  tasks:
    - name: Ensure MySQL service is running
      service:
        name: mysqld
        state: started
        enabled: yes
      when: "db_port is defined"

- name: Update app conf
  hosts: prod_servers
  become: yes
  tasks:
    - name: Copy app config file
      template:
        src: app.conf.j2
        dest: /etc/app.conf
      when: app_env == 'production'
```

在这个 playbook 中，我们定义了一个playbook，它针对 `prod_servers` 主机组中的所有主机执行任务。这个 playbook 的任务有三个：

- 确保 HTTP 服务运行。在执行这个任务之前，我们先判断主机的变量 `http_port` 是否被定义了。如果不存在或未定义，这个任务将被忽略。
- 确保 MySQL 服务运行。和上一个任务类似，这个任务会判断主机的变量 `db_port` 是否被定义了。如果不存在或未定义，这个任务将被忽略。
- 复制应用程序的配置文件。在执行这个任务之前，我们先判断变量 `app_env` 是否等于 `production`。如果不等于，这个任务将被忽略。

通过这个 playbook，我们可以根据不同的变量配置，为不同的主机或主机组定制化地执行任务。

## playbook变量

Playbook变量是在playbook级别上定义的变量，它们在playbook中的所有任务和角色中都可用。这些变量可以用于配置任务、定义主机和组、指定条件等。

下面是一个使用playbook变量的例子：

```yaml
---
- name: Playbook with variables
  hosts: all
  vars:
    web_server_port: 80
    db_server_port: 3306
  tasks:
    - name: Install Apache
      apt:
        name: apache2
        state: present
      when: "'web' in group_names"
      vars:
        apache_listen_port: "{{ web_server_port }}"
    - name: Install MySQL
      apt:
        name: mysql-server
        state: present
      when: "'db' in group_names"
      vars:
        mysql_listen_port: "{{ db_server_port }}"

```

在这个例子中，定义了两个playbook变量：`web_server_port`和`db_server_port`。这些变量在playbook中的所有任务和角色中都可用。在任务”Install Apache”和“Install MySQL”中，使用了这些变量来设置Apache和MySQL的监听端口。

## 文件变量

`vars_files` 和 `include_vars` 都是 Ansible 中用来加载变量文件的机制，但是它们有一些区别：

- `vars_files`：将变量从文件中加载到 playbook 的变量空间中，可以使用 `vars_files` 关键字来指定一个或多个 YAML 格式的文件，Ansible 会按照指定的顺序将文件中的变量合并到 playbook 的变量空间中，如果存在相同名称的变量，后面的变量会覆盖之前的变量。`vars_files` 通常用于将多个变量文件整合在一起。
- `include_vars`：将变量从文件中加载到变量空间中，并返回一个包含变量的字典，可以使用 `include_vars` 关键字来指定一个文件，Ansible 会将文件中的变量加载到一个新的变量空间中，并返回一个包含变量的字典，可以使用 `vars` 关键字来指定变量名，如果没有指定 `vars` 关键字，则会将文件中的所有变量加载到变量空间中。`include_vars` 通常用于将外部变量文件加载到 playbook 的变量空间中。

下面是一个使用 `vars_files` 和 `include_vars` 的示例：

```yaml
# playbook.yml

- name: Load variables
  hosts: all
  vars_files:
    - vars/vars1.yml
    - vars/vars2.yml
  tasks:
    - name: Task 1
      debug:
        var: var1

    - name: Task 2
      include_vars:
        file: vars/vars3.yml
        name: my_vars
      debug:
        var: my_vars

```

在这个示例中，`vars_files` 加载了 `vars1.yml` 和 `vars2.yml` 文件中的变量，如果变量名冲突，后面的变量会覆盖之前的变量。而 `include_vars` 加载了 `vars3.yml` 文件中的变量，并将这些变量存储在名为 `my_vars` 的字典中，可以在后续的任务中使用这个字典中的变量。

## Roles变量

在Ansible的roles中，有两种类型的变量可以被使用：角色默认变量和角色全局变量。

1. 角色默认变量

角色默认变量是在roles中定义的变量，用于在roles内部使用。它们的定义通常是在roles的`defaults/main.yml`文件中。

举例来说，如果我们有一个名为“web”的角色，并且希望定义一个默认变量“http_port”，则可以在`roles/web/defaults/main.yml`文件中添加如下定义：

```yaml
http_port: 80
```

在使用这个角色时，如果没有定义“http_port”变量，则会使用默认值80。

2. 角色全局变量

角色全局变量是在roles外部定义的变量，用于传递参数给roles。这些变量可以在roles的vars文件中使用。

举例来说，如果我们有一个名为“web”的角色，并且希望定义一个全局变量“nginx_version”，则可以在一个名为“vars.yml”的文件中定义该变量：

```yaml
nginx_version: 1.18.0
```

在使用这个角色时，可以使用“vars_files”指令将变量文件引入到playbook中，如下所示：

```yaml
yamlCopy code
- hosts: webservers
  vars_files:
    - vars.yml
  roles:
    - web
```

这个playbook将引入`vars.yml`文件中定义的变量，并将它们传递给“web”角色。

> **注意**：在定义角色全局变量时，应该将变量定义在playbook中，而不是在roles的defaults/main.yml文件中。因为在roles的defaults/main.yml文件中定义的变量是默认变量，不会被传递给其他角色或playbook。

## MagicVariables

1. `inventory_hostname`：当前主机在 Ansible inventory 中定义的名称
2. `inventory_hostname_short`：当前主机在 Ansible inventory 中定义的名称的第一部分
3. `hostvars`：包含当前所有主机及其变量的字典
4. `group_names`：包含当前主机所属的所有组的列表
5. `play_hosts`: 将执行当前任务的所有主机
6. `ansible_host`: 指定主机的IP地址或域名，可以在Inventory中指定或者使用`add_host`模块动态添加。
7. `ansible_port`: 指定SSH连接的端口，默认为22。
8. `ansible_user`: 指定连接主机的用户名，默认为当前用户。
9. `ansible_ssh_private_key_file`: 指定SSH连接使用的私钥文件路径。
10. `ansible_connection`: 指定连接主机的方式，默认为SSH，还支持本地连接（local）、WinRM等方式。
11. `ansible_python_interpreter`: 指定Python解释器的路径。
12. `ansible_distribution`: 操作系统的发行版，如Ubuntu、CentOS等。
13. `ansible_distribution_version`: 操作系统的版本号，如18.04、7.6等。
14. `ansible_facts`: 存储主机的各种信息，比如操作系统版本、IP地址等。详细的信息可以使用命令 `ansible 127.0.0.1 -m setup`查看。

> 在 playbook 中使用 主机的变量，有以下几种方式：

1. 引用主机变量：可以使用 `hostvars` 关键字来引用主机变量，格式为 `hostvars['主机名']['变量名']`，例如：

`inventory.ini`

```ini
; hosts 组应包含所有安装 greatdb 的主机 IP
[hosts]
172.17.140.22 ansible_connection=ssh  ansible_ssh_user=admin  manage_user=admin  root_dir=/admin 
172.17.140.101 ansible_connection=ssh  ansible_ssh_user=admin  manage_user=admin  root_dir=/admin 

[binlog_servers:children]
masters
slaves

; define masters
[masters]
bing_server1 ansible_host=172.17.140.22 port=3326 

; define slaves
[slaves]
bing_server2 ansible_host=172.17.140.101 port=3326
```

输出主机组masters中第一个主机的信息

```yml
- name: change slave binlog server to master
  debug:
    msg: "master_host='{{hostvars[master_binlog_server].ansible_host}}',master_port={{hostvars[master_binlog_server].port}}"
  vars:
    master_binlog_server: "{{ groups['masters'][0] }}"
  no_log: true
```

循环输出主机组masters中所有主机的信息

```yml
- name: upload backup file to slave sqlnodes
  debug:
    cmd: "master_host='{{hostvars[item].ansible_host}}',master_port={{hostvars[item].port}}"
  with_items: "{{ groups['masters'] }}"
```

2. 使用 `ansible_*` 系列变量：在 playbook 中可以使用 `ansible_*` 系列变量，这些变量是由 Ansible 自动设置的，比如：

```yaml
- name: Example playbook
  hosts: all
  tasks:
    - name: Print Ansible facts
      debug:
        var: ansible_distribution
```

这里的 `ansible_distribution` 就是一个 Ansible 内置变量，表示当前系统的发行版。

3. 使用 `lookup()` 函数：在 playbook 中可以使用`lookup('env')`和`lookup('ini')`分别获取主机的环境变量和inventory中定义的变量。

假设目标主机的环境变量 `MY_ENV_VAR` 的值为 `my_value`，可以在 playbook 中使用以下方式来获取该环境变量的值：

```yaml
- name: Example playbook
  hosts: all
  tasks:
    - name: Print variable using lookup
      debug:
        var: lookup('env', 'MY_ENV_VAR')
```

比如，假设我们在inventory文件中定义了一个名为webserver的组，并且为这个组中的主机定义了一个变量`http_port=80`，那么我们可以在playbook中使用lookup(‘ini’)来获取这个变量：

```yaml
- hosts: webserver
  tasks:
    - debug:
        var: lookup('ini', 'http_port type=host group=webserver file=/path/to/inventory.ini')
```

这里，我们使用了lookup(‘ini’)函数，并指定了以下参数：

- `type=host`：表示我们要获取主机级别的变量，而不是组级别或全局级别的变量。
- `group=webserver`：表示我们要获取webserver组中的主机的变量。
- `file=/path/to/inventory.ini`：表示我们的inventory文件的路径。

通过这个lookup函数，我们可以获取到webserver组中所有主机的http_port变量的值。

## 注册变量

注册变量，其实就是将操作结果，包括标准输出和标准错误输出，保存到变量中，然后再根据这个变量的内容来决定下一步的操作，在这个过程中用来保存操作结果的变量就叫注册变量。

```yaml
---
 - hosts: all
   remote_user: root
   gather_facts: no
   tasks:
     - name: test the register variables
       shell: uptime
       register: results     # 使用关键字register声明注册变量，上面uptime命令产生的结果，存入到results中。结果是字典形式。
 
     - name: print the register result
       debug: msg="{{ results.stdout }}"   # 使用debug模块，打印出上面命令的输出结果。
```

上面的playbook执行结果如下：

```shell
$ ansible-playbook test.yml
 
PLAY [all] ********************************************************************
 
TASK: [test the register variables] *******************************************
changed: [10.0.102.212]
changed: [10.0.102.200]
changed: [10.0.102.162]
 
TASK: [print the register result] *********************************************
ok: [10.0.102.212] => {
    "msg": " 00:18:01 up 3 days,  2:56,  3 users,  load average: 0.02, 0.03, 0.05"          #msg的结果就是注册变量的标准输出
}
ok: [10.0.102.200] => {
    "msg": " 00:18:04 up 4 days,  7:45,  3 users,  load average: 0.03, 0.06, 0.05"
}
ok: [10.0.102.162] => {
    "msg": " 00:18:04 up 4 days,  7:45,  3 users,  load average: 0.01, 0.02, 0.05"
}
 
PLAY RECAP ********************************************************************
10.0.102.162               : ok=2    changed=1    unreachable=0    failed=0
10.0.102.200               : ok=2    changed=1    unreachable=0    failed=0
10.0.102.212               : ok=2    changed=1    unreachable=0    failed=0
```

一个注册变量通常会有以下4个属性：

- `changed`：任务是否对远程主机造成的变更。
- `delta`：任务运行所用的时间。
- `stdout`：正常的输出信息。
- `stderr`：错误信息。
