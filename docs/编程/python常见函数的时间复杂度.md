---
title: python常见函数的时间复杂度
createTime: 2019/05/25 11:21:16
permalink: /article/bv3xb8si/
tags:
  - Python
category: 编程
---

很多函数都有自己的很多方法，其中有些方法的功能类似，但是其复杂度有时却大不相同

本节我们将引入一个新模块 `timeit` ，其功能是来测试一小段 `Python` 代码的执行速度。

### timeit

```python
class timeit.Timer(stmt='pass', setup='pass',timer=<timer function>)
```

- `Timer` 是测量小段代码执行速度的类
- `stmt` 是要测试的代码语句 (`statment`), 字符串类型,
- `setup` 是运行代码时需要的设置 , 字符串类型, 就是从 `__main__` 引入需要的是的方法名
- `timer` 参数是一个定时器函数, 与平台有关, 不用去管
- ​`timeit.Timer.timeit(numer=1000000)`​，`numer`​-> 测算次数, 返回平均耗时, 一个 `float`​ 类型的秒数

部分测试示例

```python
from timeit import Timer


def test6():
    li = []
    for i in range(10000):
        li.append(i)


def test7():
    li = []
    for i in range(10000):
        li.insert(0, i)


timer6 = Timer("test6()", "from __main__ import test6")
print("append(i):", timer6.timeit(1000))
timer7 = Timer("test7()", "from __main__ import test7")
print("insert(0):", timer7.timeit(1000))
```

测试结果

```bash
append(i): 0.801551224
insert(0): 22.552706398
```

### list 的内置函数时间复杂度

|方法|复杂度|简介|
| ----------------| --------| ----------------------------------------------------------------------|
|index[x]|O(1)|索引|
|index assignment|O(1)|索引赋值|
|append|O(1)|尾部追加|
|pop()|O(1)|尾部弹出|
|pop(i)|O(n)|指定位置弹出 n 列表长度, 最坏时间复杂度|
|insert(i, item)|O(n)|指定位置添加|
|del operator|O(n)|删除, 代表一个一个元素去清空|
|iteration|O(n)|迭代|
|contains(in)|O(n)|看谁是否在列表中, 需要遍历|
|get slice[x:y]|O(k)|取切片, 从 x 取到 y, 一次定位到 x, 然后取到 y ,x 和 y 之间有多少就是 k|
|del slice|O(n)|删除切片 删除位置之后, 后面的元素都需要往前移动|
|set slice|O(k)|设置切片, li[0:3] = [1, 2, 3, 4]k 是补充的东西数量|
|reverse|O(n)|置返|
|concatenate|O(k)|代表使用的 +, 把两个列表加到一起, k 是第二个列表中的元素|
|sort|O(nlogn)|排序|
|multiply|O(nk)|相乘 li=[1, 2] -> n li * 10 -> k|

### dict 的内置函数时间复杂度

|方法|复杂度|简介|
| ------------| ------| ------|
|copy|O(n)|复制|
|get item|O(1)|取|
|set item|O(1)|设置|
|delete item|O(1)|删除键|
|contains(in)|O(1)|包含|
|iteration|O(n)|迭代|
