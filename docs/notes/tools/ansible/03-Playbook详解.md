---
title: 03-Playbook详解
createTime: 2025/03/21 22:12:18
permalink: /ansible/d08e8zib/
---
### 流程控制语句

　　条件判断在ansible任务中的使用频率非常高。我们可以根据一些条件的不一样执行不同的task。

#### when条件判断

　　很多任务只有在特定条件下才能执行，这就是when语句发挥作用的地方。

　　一个简单的实例，关闭掉ip地址为10.0.102.162服务器上的mysql服务，如下：

```yaml
---
 - hosts: all
   remote_user: root
   tasks:
     - name: shut down the db server
       service: name=mysqld state=stopped
       when: ansible_eth0.ipv4.address  == "10.0.102.162"  # 这里使用了when条件语句
```

　　执行的结果如下：

```shell
$ ansible-playbook test.yml
 
PLAY [all] ********************************************************************
 
GATHERING FACTS ***************************************************************
ok: [10.0.102.212]
ok: [10.0.102.200]
ok: [10.0.102.162]
 
TASK: [shut down the db server] ***********************************************
skipping: [10.0.102.200]
skipping: [10.0.102.212]
changed: [10.0.102.162]       # 162的服务状态已经改变
 
PLAY RECAP ********************************************************************
10.0.102.162               : ok=2    changed=1    unreachable=0    failed=0
10.0.102.200               : ok=1    changed=0    unreachable=0    failed=0
10.0.102.212               : ok=1    changed=0    unreachable=0    failed=0
```

　　这个就是when条件语句的用法很简单。需要注意when语句的作用于paly的作用时间，当when的条件满足时，然后才会执行play中的任务。ansible还提供了另外两个与when相关的语句`changed_when`和`failed_when`条件判断。

### 任务间的流程控制

#### 任务委托

　　默认情况下，ansible所有任务都是在我们指定的机器上面运行的，当在一个独立的集群环境配置时，这并没有什么问题。而在有些情况下，比如给某台服务器发送通知或者向监控服务器中添加被监控的主机，这个时候任务就需要在特定的主机上运行，而非一开始指定的所有主机，此时就需要ansible的委托任务。

　　使用`delegate_to`关键字可以配置任务在指定的服务器上执行，而其他任务还是在hosts关键字配置的所有机器上执行，当到了这个关键字所在的任务时，就使用委托的机器运行。

　　查看MySQL是否在运行状态，因此在检查之前首先关掉162上的mysql服务。（为了方便查看状态）

```yaml
---
 - hosts: all
   remote_user: root
   tasks:
     - name: stop the db server
       service: name=mysqld state=stopped
       delegate_to: 10.0.102.162       # 这里使用了委托，仅关闭162这台服务器上，这个play仅在162这台服务器上执行。
 
     - name: check mysql status
       service: name=mysqld state=running
```

　　这里委托是在指定的机器上执行，若是想在本地服务器上执行，可以把ip地址换为127.0.0.1即可。也可以使用`local_action`方法。

```yaml
---
 - hosts: all
   remote_user: root
   tasks:
     - name: create the test file
       local_action: shell touch test1111 # 在本地创建一个测试文件
 
 
     - name: check mysql status
       service: name=mysqld state=running
```

　　结果如下：

```shell
$ ansible-playbook test.yml
 
PLAY [all] ********************************************************************
 
GATHERING FACTS ***************************************************************
ok: [10.0.102.212]
ok: [10.0.102.200]
ok: [10.0.102.162]
 
TASK: [create the test file] **************************************************
changed: [10.0.102.212 -> 127.0.0.1]
changed: [10.0.102.200 -> 127.0.0.1]
changed: [10.0.102.162 -> 127.0.0.1]
 
TASK: [check mysql status] ****************************************************
ok: [10.0.102.200]
ok: [10.0.102.212]
ok: [10.0.102.162]
 
PLAY RECAP ********************************************************************
10.0.102.162               : ok=3    changed=1    unreachable=0    failed=0
10.0.102.200               : ok=3    changed=1    unreachable=0    failed=0
10.0.102.212               : ok=3    changed=1    unreachable=0    failed=0

$ ls                     # 默认会在当前目录创建对应的文件
test1111  test.yml  vars.yml
```

#### 任务暂停

　　有些情况下，一些任务的运行需要等待一些状态的恢复，比如某一台主机或者应用刚刚重启，我们需要等待它上面的某个端口开启，此时我们就不得不将正在运行的任务暂停，直到其状态满足我们的需求。

　　下一个实例：

```yaml
- name: wait for webserver to start
   local_action:
        module: wait_for
        host: webserver1
        port: 80
        delay: 10
        timeout: 300
        state: startted
# 这个实例中，这个任务将会每10s检查一次主机webserver1上面的80端口是否开启，如果超过了300s则失败
```

#### 交互式提示

　　在少数情况下，ansible任务运行的过程中需要用户输入一些数据，这些数据要么比较秘密不方便，或者数据是动态的，不同的用户有不同的需求，比如输入用户自己的账户和密码或者输入不同的版本号会触发不同的后续操作等。ansible的`vars_prompt`关键字就是用来处理上述这种与用户交互的情况的。下面是一个简单的实例。

```yaml
---
 - hosts: all
   remote_user: root
   vars_prompt:
      - name: share_user
        prompt: "what is your network username?"
        private: no
 
      - name: share_pass
        prompt: "what is your network password"
        private: no
```

　　然后执行上面的playbook，因为我们只是测试，只需要在一台机器上执行，因此加入了`--limit`参数。

```shell
$ ansible-playbook test.yml --limit 10.0.102.162
what is your network username?: test        # 需要手动交互输入
what is your network password: 123456       # 手动输入
 
PLAY [all] ********************************************************************
 
GATHERING FACTS ***************************************************************
ok: [10.0.102.162]
 
PLAY RECAP ********************************************************************
10.0.102.162               : ok=1    changed=0    unreachable=0    failed=0
```

　　手动输入的变量值，在后面的play中仍然可以用`{{ var_name }}`的形式调用。

　　关键字`vars_prompt`几个常用的选项总结如下：

- `private`：默认值为yes，表示用户输入的值在命令行不可见；将值设为no时，用户输入可见。
- `default`：为变量设置默认值，以节省用户输入时间。
- `confirm`：特别适合输入密码的情况，如果将其设置为yes，则会要求用户输入两次，以增加输入的安全性。

### tags标签

　　默认情况下，ansible在执行一个playbook时，会执行playbook中定义的所有任务。ansible的标签功能可以给角色，文件，单独的任务甚至整个playbook打上标签，然后利用这些标签来指定要运行playbook中的个别任务，或不执行指定的任务，并且它的语法非常简单。

　　通过一段代码来说明tags的用法：

```yaml
 
---
# 可以给整个playbook的所有任务打一个标签。
  - hosts: all
    tags: deploy
    roles:
     # 给角色打的标签将会应用与角色下所有的任务。
       - {role: tomcat, tags : ["tomcat", "app"]}        # 一个对象添加多个tag的写法之一
    tasks:
       - name: Notify on completion
         local_action:
            module: osx_say
            msg: "{{inventory_hostname}} is finished"
            voice: Zarvox
         tags:      # 一个对象添加多个tag写法之二
            - notifications
            - say
       - include: foo.yml
         tags:　foo
 
# 缩进可能不太对
```

　　将上述代码保存，可以通过以下命令来只执行`Notify on completion`任务。

```shell
$ ansible-playbook test.yml --tags "say"
```

　　如果想忽略掉某个任务，可以使用`--skip-tags`关键字指定。

### Block块

　　ansible从2.0.0版本开始引入了块功能。块功能可以将任务进行分组，并且可以在块级别上应用任务变量。同时，块功能还可以使用类似于其他编程语言处理异常那样的方法，来处理块内部的任务异常。

```yaml
---
 - hosts: all
   remote_user: root
 
   tasks:
     - block:
          - yum: name=httpd state=present
          - service: name=httpd state=started enabled=no
       when:  ansible_eth0.ipv4.address  == "10.0.102.162"
 
     - block:
          - yum: name=nginx state=present
          - service: name=nginx state=started enabled=no
       when:  ansible_eth0.ipv4.address  == "10.0.102.200"
```

　　运行结果如下：

```shell
$ ansible-playbook -i hosts test.yml
 
PLAY [all] **************************************************************************************************************************************************************************************
 
TASK [Gathering Facts] **************************************************************************************************************************************************************************
ok: [10.0.102.162]
ok: [10.0.102.200]
 
TASK [yum] **************************************************************************************************************************************************************************************
skipping: [10.0.102.200]          # 因为在inventory文件中注释了这一台服务器，因此这里忽略了。
ok: [10.0.102.162]
 
TASK [service] **********************************************************************************************************************************************************************************
skipping: [10.0.102.200]
changed: [10.0.102.162]
 
TASK [yum] **************************************************************************************************************************************************************************************
skipping: [10.0.102.162]
ok: [10.0.102.200]
 
TASK [service] **********************************************************************************************************************************************************************************
skipping: [10.0.102.162]
changed: [10.0.102.200]
 
PLAY RECAP **************************************************************************************************************************************************************************************
10.0.102.162               : ok=3    changed=1    unreachable=0    failed=0
10.0.102.200               : ok=3    changed=1    unreachable=0    failed=0
```

　　上面的playbook和之前的并没有什么不同，只是假如了block之后，代码更容易查看。

　　块功能可以用来处理任务的异常。比如一个ansible任务时监控一个并不太重要的应用，这个应用的正常运行与否对后续的任务并不产生影响，这时候我们就可以通过块功能来处理这个应用的报错。如下代码：

```yaml
tasks:
   - block:
        - name: shell script to connect the app ti a mointoring service.
          script: mointoring-connect.sh
          rescue:
             - name:只有脚本报错时才执行
　　　　　　　　 debug：msg="There was an error in the block"
          always:
             - name: 无论结果如何都执行
               debug: msg="This always executes"
```

　　当块中任意任务出错时，rescue关键字对应的代码块就会被执行，而always关键字对应的代码块无论如何都会被执行。
