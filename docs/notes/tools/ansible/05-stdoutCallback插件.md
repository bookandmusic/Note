---
title: 05-stdoutCallback插件
createTime: 2025/03/21 22:12:18
permalink: /ansible/svfb60mh/
---

`stdout_callback`是Ansible Playbook中的一个回调插件，用于在执行Playbook期间向标准输出流打印信息。该插件提供了一种方式来自定义打印输出格式，并允许用户在执行期间观察Ansible任务的进度。

## 自定义stdout_callback插件

以下是一个示例，自定义`stdout_callback`插件,隐藏日志中的sql命令：

```python
import os
import re

from ansible.plugins.loader import callback_loader

DOCUMENTATION = """
    callback: hidden_password
    short_description: Playbook hidden password for ansible
    version_added: "0.1"
    description:
        - Replace and hide the password information in the log through regularization
    type: stdout
    extends_documentation_fragment:
      - default_callback
    requirements:
      - Set as stdout in config
"""

IS_ADHOC = os.getenv("AD_HOC_COMMAND_ID", False)
# Dynamically construct base classes for our callback module, to support custom stdout callbacks.
if IS_ADHOC:
    default_stdout_callback = "minimal"
else:
    default_stdout_callback = "default"

DefaultCallbackModule = callback_loader.get(default_stdout_callback).__class__


class CallbackModule(DefaultCallbackModule):
    CALLBACK_NAME = "hidden_password"
    CALLBACK_VERSION = 2.0
    CALLBACK_TYPE = "stdout"

    # These events should never have an associated play.
    EVENTS_WITHOUT_PLAY = [
        "playbook_on_start",
        "playbook_on_stats",
    ]

    # These events should never have an associated task.
    EVENTS_WITHOUT_TASK = EVENTS_WITHOUT_PLAY + [
        "playbook_on_setup",
        "playbook_on_notify",
        "playbook_on_import_for_host",
        "playbook_on_not_import_for_host",
        "playbook_on_no_hosts_matched",
        "playbook_on_no_hosts_remaining",
    ]

    def hide_passwords(self, result):
        if isinstance(result, dict):
            for k, v in result.items():
                result[k] = self.hide_passwords(v)
        elif isinstance(result, str):
            result = re.sub(
                r" (-p|--password=)([\'\"]?)\S+?(\2) ", " -p'******' ", result
            )
            result = re.sub(
                r"^(-p|--password=)([\'\"]?)\S+?(\2)$", "-p'******'", result
            )
        elif isinstance(result, list):
            result = [self.hide_passwords(item) for item in result]
        return result

    def v2_runner_on_failed(self, result, ignore_errors=False):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_on_failed(result, ignore_errors)

    def v2_runner_on_ok(self, result):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_on_ok(result)

    def v2_runner_item_on_failed(self, result):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_item_on_failed(result)

    def v2_runner_item_on_ok(self, result):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_item_on_ok(result)

    def v2_runner_on_async_failed(self, result):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_on_async_failed(result)

    def v2_runner_on_async_ok(self, result):
        result._result = self.hide_passwords(result._result)
        super(CallbackModule, self).v2_runner_on_async_ok(result)

```

## ansible

添加自定义插件到环境变量

```bash
# 自定义callback插件包路径
export ANSIBLE_CALLBACK_PLUGINS="/project/plugins/callback"
# callback插件名称
export ANSIBLE_STDOUT_CALLBACK="hidden_password"
```

执行playbook

```bash
ansible-playbook -i inventory/inventory.ini mysql.yml
```

输出日志中，会自动隐藏密码。

## ansible_runner

使用ansible_runner执行playbook

> 使用最新的`ansible_runner`，因为旧版中，不允许修改`stdout_callback`插件，就必须在初始化`runner`对象后，手动修改`runner.config.env`中的环境变量`ANSIBLE_STDOUT_CALLBACK`。

```python
import os

from ansible_runner import interface

base_dir = os.getcwd()
project_dir = os.path.join(base_dir, "project")

ANSIBLE_PLUGINS_DIR = os.path.join(project_dir, "plugins")
ANSIBLE_PLUGINS_CALLBACK_DIR = os.path.join(ANSIBLE_PLUGINS_DIR, "callback")
ANSIBLE_CALLBACKS_ENABLED = "profile_tasks"

playbook = os.path.join(project_dir, "mysql.yml")
inventory = os.path.join(project_dir, "inventory", "inventory.yaml")
private_data_dir = os.path.join(project_dir, "tmp")

env = {
    "ANSIBLE_ROLES_PATH": os.path.join(project_dir, "project/roles"),
    "ANSIBLE_CALLBACKS_ENABLED": ANSIBLE_CALLBACKS_ENABLED,
    "ANSIBLE_NO_TARGET_SYSLOG": True,
    "ANSIBLE_REFRESH_INTERVAL": 0.1,
    "ANSIBLE_CALLBACK_PLUGINS": ANSIBLE_PLUGINS_CALLBACK_DIR,
    "ANSIBLE_STDOUT_CALLBACK": "hidden_password",
}

params = {
    "private_data_dir": private_data_dir,
    "playbook": playbook,
    "inventory": inventory,
    "envvars": env,
    # "verbosity": 2,
}

res = interface.run(
    project_dir=project_dir,
    **params,
)

```
