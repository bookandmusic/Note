---
title: 04-Ansible模块
createTime: 2025/03/21 22:12:18
permalink: /ansible/oliccai1/
---
## 条件判断

### assert

　　`that`：指定需要判断的条件，可以指定多个条件，条件之间关系是与

　　`fail_msg`：当条件为 `false`，输出错误信息

　　`success_msg`：当条件为 `true`时，输出成功信息

```yaml
---

- name: circle array
  gather_facts: false
  hosts: hosts
  tasks:
    - name: execute cmd to mysql version
      shell:
        cmd: "/usr/local/bin/mysql --version | awk '{ print $3}'"
      register: version

    - name: assert mysql version >= 8.x
      vars:
        mysql_ver: "{{version.stdout}}"
      assert:
        that:
          - "version.stdout is version(8.0, '>=')"
        fail_msg: "mysql version is {{mysql_ver}}, the version must be gather than 8.x"
        success_msg: "mysql version is {{mysql_ver}}"

```

### version

　　使用各种版本控制方案比较版本字符串

```yaml
- name: version test examples
  assert:
    that:
      - "'1.0' is version('1.0', '==')"  # 支持所有的比较运算符：==、!=、>、>=、<=、<
      - "'1.0rc1' is version('1.0', '!=', strict=true)"  # 严格匹配模式
      - "'1.0' is version('1.0', '==', strict=true)"
      - "'1.0' is version('2.0', 'lt')"  # 支持比较运算符: lt、lte、gt、gte、eq
      - "'1.2.3' is version('2.0.0', 'lt', version_type='semver')"  # 指定版本类型
      - "'2.14.0rc1' is version('2.14.0', 'lt', version_type='pep440')"
```

### 文件状态

　　`is exists`：判断文件路径存在

　　`stat.exists`：判断文件存在

```yaml
---

- name: check exists
  gather_facts: false
  hosts: test1

  vars:
    tmp_path: "/tmp/"
    tmp_file: "/tmp/qa.txt"
  
  tasks:
    - name: check path exists
      debug:
        msg: "{{tmp_path}}"
      when: tmp_path is exists

    - name: check file stat
      stat:
        path: "{{tmp_file}}"
      register: file_data
    
    - name: check file exists
      debug:
        msg: "{{tmp_file}}"
      when: file_data.stat.exists
  
```

## 循环数据

### 循环数组

> 循环数组： `loop`、`with_list`、`with_items`

```yaml
---
- name: circle array
  gather_facts: false
  hosts: hosts
  vars:
    - nums: [1, 2, 3, 4]
  tasks:
    - name: loop
      debug:
        msg: "{{item}}"
      loop: "{{nums}}"
      when: item > 2

    - name: with_list
      debug:
        msg: "{{item}}"
      with_list: "{{nums}}"
      when: item > 2

    - name: with_items
      debug:
        msg: "{{item}}"
      with_items: "{{nums}}"
      when: item > 2
```

### 循环字典

> 循环字典：`with_dict`、`with_items`

```yaml
- name: circle dict
  gather_facts: false
  hosts: hosts
  vars:
    person: {"name":"a1", "gender":"man"}
  tasks:
    - name: with_dict
      debug:
        msg: "{{item.key}}==={{item.value}}"
      with_dict: "{{person}}"
    - name: with_items
      debug:
        msg: "{{item}}==={{person[item]}}"
      with_items: "{{person}}"
```

### 循环组合

> 循环组合：`with_subelements`

```yml
- name: circle object
  gather_facts: false
  hosts: hosts
  vars:
    books: 
      - name: 书1
        author:
          - a1
          - a2
      - name: 书2
        author: 
          - a1 
  tasks:
    - name: with_subelements
      debug:
        msg: "{{item}}"
      with_subelements: 
        - "{{books}}"
        - author
```

　　按照指定的键，将该键对应的值(**类型必须是列表**)和对象其余元素组合为一个新对象，然后遍历循环得到所有组合。

```shell
🔋97% 🕙[ 20:39:59 ] ✗  ansible-playbook -i inventory.ini test.yaml

PLAY [circle object] ****************************************************************************************************************************

TASK [with_subelements] *************************************************************************************************************************
ok: [host1] => (item=[{'name': '书1'}, 'a1']) => {
    "msg": [
        {
            "name": "书1"
        },
        "a1"
    ]
}
ok: [host1] => (item=[{'name': '书1'}, 'a2']) => {
    "msg": [
        {
            "name": "书1"
        },
        "a2"
    ]
}
ok: [host1] => (item=[{'name': '书2'}, 'a1']) => {
    "msg": [
        {
            "name": "书2"
        },
        "a1"
    ]
}

PLAY RECAP **************************************************************************************************************************************
host1                      : ok=1    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   

```
