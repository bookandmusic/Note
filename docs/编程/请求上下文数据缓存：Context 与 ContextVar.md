---
title: 请求上下文数据缓存：Context 与 ContextVar
createTime: 2024/10/16 11:21:16
permalink: /article/kron4ka7/
tags:
  - Python
category: 编程
---
在 视图处理 和异步编程中，管理请求上下文的数据是一个常见的需求。在这篇博客中，我们将探讨如何使用 Python 的 `contextvars`​ 模块中的 `Context`​ 和 `ContextVar`​ 来实现请求上下文的缓存数据。我们将使用`FastAPI`​通过一个具体的代码示例来演示其用法，并对每个部分进行详细解释。

## 什么是 Context 和 ContextVar？

​`contextvars`​ 是 Python 3.7 引入的模块，旨在为异步编程提供更好的上下文管理。它允许在异步任务之间安全地存储和访问状态信息。

* **ContextVar**: 用于创建上下文变量，可以在特定上下文中存储数据。每个 `ContextVar`​ 在不同的上下文中可以有不同的值。
* **Context**: 用于在异步操作中管理多个 `ContextVar`​ 实例，允许不同的任务拥有各自的上下文。

## 代码示例

### 数据模型定义

我们首先定义几个数据模型，用于表示节点、成员、参数以及检查结果。使用 Pydantic 的 `BaseModel`​ 来创建这些模型。

```python
from pydantic import BaseModel
from typing import List

class Node(BaseModel):
    id: int
    name: str
    host: str


class Member(BaseModel):
    node_id: int
    name: str
    host: str
    port: int


class Param(BaseModel):
    name: str
    members: List[Member]


class CheckNodeResult(BaseModel):
    node_id: int
    message: str


class CheckItemResult(BaseModel):
    name: str
    description: str
    not_success_nodes: List[CheckNodeResult]
```

**解释**:

* **Node**: 表示一个节点的基本信息，包括 `id`​、`name`​ 和 `host`​。
* **Member**: 表示集群中的一个成员，包含 `node_id`​、`name`​、`host`​ 和 `port`​。
* **Param**: 包含一个集群名称和成员列表。
* **CheckNodeResult**: 表示单个节点检查的结果，包含节点 ID 和消息。
* **CheckItemResult**: 表示一次检查的结果，包含检查项名称、描述以及未成功的节点列表。

### 上下文变量的定义与使用

我们定义一个混入类 `ParamNodesMixin`​，用于处理节点的缓存和获取。

```python
from contextvars import Context, ContextVar


class ParamNodesMixin:
    # 定义一个 ContextVar 来存储节点缓存，默认为 None
    _nodes_cache_var: ContextVar[list[Node]] = ContextVar("nodes_cache", default=[])

    async def get_node_by_id(self, node_id: int) -> Node | None:
        nodes = {
            1: Node(id=1, name="node1", host="172.16.70.101"),
            2: Node(id=2, name="node2", host="172.16.70.102"),
            3: Node(id=3, name="node3", host="172.16.70.103"),
        }
        return nodes.get(node_id, None)

    async def get_nodes(self, params: Param, context: Context) -> list[Node]:
        # 尝试从传递的上下文中获取节点缓存
        nodes_cache = context.get(self._nodes_cache_var, None)

        # 如果缓存不存在，则执行节点信息的获取逻辑
        if not nodes_cache:
            print("执行获取节点信息...")
            nodes_cache = []
            ex_node_id = set()
            # 遍历传入的成员参数，获取对应的节点信息
            for member in params.members:
                node_id = member.node_id
                if node_id in ex_node_id:
                    continue
                node = await self.get_node_by_id(node_id)
                if node:
                    nodes_cache.append(node)
                    ex_node_id.add(node_id)
                else:
                    raise Exception(f"node_id: {member.node_id} 未找到")

            # 使用 context.run 方法设置节点缓存
            # 这里使用 Context 而不是直接使用 ContextVar，是因为 Context 可以在不同的异步任务中共享状态
            # 通过 context.run，我们可以在指定的上下文中设置 _nodes_cache_var 的值，这样确保
            # 在当前上下文下的所有异步调用都能正确访问到更新后的节点缓存
            context.run(self._nodes_cache_var.set, nodes_cache)

        return nodes_cache
```

**解释**:

* ​`_nodes_cache_var`​ 是一个 `ContextVar`​，用于缓存节点数据。
* ​`get_node_by_id`​ 方法根据节点 ID 获取节点信息。
* ​`get_nodes`​ 方法尝试从缓存中获取节点。如果缓存为空，则根据传入的成员列表获取节点并更新缓存。

### 检查项的基类与实现

我们定义一个抽象基类 `CheckItemBase`​，以及两个具体的检查项类。

```python
from abc import ABC, abstractmethod
from typing import List, Type


CheckItemClass: dict[str, Type["CheckItemBase"]] = {}


class CheckItemBase(ABC):
    name: str
    description: str | None
    _abc = True

    def __init_subclass__(cls) -> None:
        if cls._abc:
            return
        if not cls.name:
            raise NameError('%s must implement "name" property ' % str(cls))
        if cls.name in CheckItemClass:
            raise NameError("item name: (%s) exists" % cls.name)
        CheckItemClass[cls.name] = cls

    @abstractmethod
    async def check_nodes(self, params: Param, context: Context) -> CheckItemResult:
        raise NotImplementedError


class CheckNodeOSVersion(CheckItemBase, ParamNodesMixin):
    name: str = "check_os_version"
    description: str = "检查操作系统版本"
    _abc = False

    async def check_nodes(self, params: Param, context: Context) -> CheckItemResult:
        nodes = await self.get_nodes(params, context)
        not_success_nodes: List[CheckNodeResult] = []
        for node in nodes:
            if node.id < 2:
                not_success_nodes.append(
                    CheckNodeResult(
                        node_id=node.id,
                        message=f"{node.host} 操作系统版本过低, 当前系统版本为 7.{node.id}",
                    )
                )
        return CheckItemResult(
            name=self.name,
            description=self.description,
            not_success_nodes=not_success_nodes,
        )


class CheckNodeSystemdVersion(CheckItemBase, ParamNodesMixin):
    name: str = "check_systemd_version"
    description: str = "检测 systemd 检查版本 >213 且 != 231"
    _abc = False

    async def check_nodes(self, params: Param, context: Context) -> CheckItemResult:
        nodes = await self.get_nodes(params, context)
        not_success_nodes: List[CheckNodeResult] = []
        for node in nodes:
            if node.id >= 2:
                not_success_nodes.append(
                    CheckNodeResult(
                        node_id=node.id, message=f"{node.host} 当前 systemd 版本为:231"
                    )
                )
        return CheckItemResult(
            name=self.name,
            description=self.description,
            not_success_nodes=not_success_nodes,
        )
```

**解释**:

* ​`CheckItemBase`​ 是一个抽象类，定义了 `check_nodes`​ 方法，所有检查项都需要实现该方法。
* ​`CheckNodeOSVersion`​ 和 `CheckNodeSystemdVersion`​ 是具体的检查项类，分别实现了对操作系统版本和 systemd 版本的检查。

### FastAPI 路由定义

最后，我们创建 FastAPI 应用并定义路由。

```python
from fastapi import FastAPI
import uvicorn


app = FastAPI()


@app.post("/", response_model=List[CheckItemResult])
async def check_cluster(params: Param) -> List[CheckItemResult]:
    context = Context()
    results: List[CheckItemResult] = []
    for cls in CheckItemClass.values():
        result = await cls().check_nodes(params, context)
        results.append(result)
    return results


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

**解释**:

* 创建一个 POST 路由 `/`​，接受参数并执行所有已注册的检查项。
* 每个检查项的结果都会添加到结果列表中并返回。

## 总结

通过使用 `contextvars`​ 模块中的 `Context`​ 和 `ContextVar`​，我们能够有效地管理和缓存请求上下文中的数据。这种方法在处理多个异步任务时尤其有用，可以避免重复查询和提高性能。

‍
