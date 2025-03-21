---
title: JWT浅析
createTime: 2020/10/24 11:21:16
permalink: /article/nhr9fdww/
tas:
  - AUTH
category: 网站开发
---

Json web token (JWT), 是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准([RFC 7519](https://tools.ietf.org/html/rfc7519)).

token 被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。

JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该 token 也可直接被用于认证，也可被加密。

## Jwt起源

说起 JWT，我们应该来谈一谈基于 token 的认证和传统的 session 认证的区别。

### 传统的 session 认证

我们知道，http 协议本身是一种无状态的协议，而这就意味着如果用户向我们的应用提供了用户名和密码来进行用户认证，那么下一次请求时，用户还要再一次进行用户认证才行，因为根据 http 协议，我们并不能知道是哪个用户发出的请求，所以为了让我们的应用能识别是哪个用户发出的请求，我们只能在服务器存储一份用户登录的信息，这份登录信息会在响应时传递给浏览器，告诉其保存为 cookie, 以便下次请求时发送给我们的应用，这样我们的应用就能识别请求来自哪个用户了, 这就是传统的基于 session 认证。

但是这种基于 session 的认证使应用本身很难得到扩展，随着不同客户端用户的增加，独立的服务器已无法承载更多的用户，而这时候基于 session 认证应用的问题就会暴露出来.

> 基于 session 认证所显露的问题

**Session**: 每个用户经过我们的应用认证之后，我们的应用都要在服务端做一次记录，以方便用户下次请求的鉴别，通常而言 session 都是保存在内存中，而随着认证用户的增多，服务端的开销会明显增大。

**扩展性**: 用户认证之后，服务端做认证记录，如果认证的记录被保存在内存中的话，这意味着用户下次请求还必须要请求在这台服务器上, 这样才能拿到授权的资源，这样在分布式的应用上，相应的限制了负载均衡器的能力。这也意味着限制了应用的扩展能力。

**CSRF**: 因为是基于 cookie 来进行用户识别的, cookie 如果被截获，用户就会很容易受到跨站请求伪造的攻击。

### 基于 token 的鉴权机制

基于 token 的鉴权机制类似于 http 协议也是无状态的，它不需要在服务端去保留用户的认证信息或者会话信息。这就意味着基于 token 认证机制的应用不需要去考虑用户在哪一台服务器登录了，这就为应用的扩展提供了便利。

流程上是这样的：

* 用户使用用户名密码来请求服务器
* 服务器进行验证用户的信息
* 服务器通过验证发送给用户一个 token
* 客户端存储 token，并在每次请求时附送上这个 token 值
* 服务端验证 token 值，并返回数据

这个 token 必须要在每次请求时传递给服务端，它应该保存在请求头里， 另外，服务端要支持`CORS(跨来源资源共享)`策略，一般我们在服务端这么做就可以了`Access-Control-Allow-Origin: *`。

那么我们现在回到 JWT 的主题上。

## JWT解析

网上大多数介绍JWT的文章实际介绍的都是`JWS(JSON Web Signature)`,也往往导致了人们对于JWT的误解，但是JWT并不等于JWS，JWS只是JWT的一种实现，除了JWS外，`JWE(JSON Web Encryption)`也是JWT的一种实现。

下面就来详细介绍一下JWT与JWE的两种实现方式：

![](attachment/9540d3aa51333a31f23ac4c465b69aa7.webp)

### JSON Web Signature(JWS)

JSON Web Signature是一个有着简单的统一表达形式的字符串：由三段信息构成的，将这三段信息文本用`.`链接一起就构成了 Jwt 字符串。

* 第一部分我们称它为头部（header)
* 第二部分我们称其为载荷（payload, 类似于飞机上承载的物品)
* 第三部分是签证（signature)

![](attachment/3e1417f08b78746cab1ee7f36fbe007d.png)​​​

然后将每一部分进行`base64`编码之后，就像这样:

```python
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

#### header（头信息）

jwt 的头部承载两部分信息：

* 令牌类型（即：JWT）
* 散列算法（HMAC、RSASSA、RSASSA-PSS等）

完整的头部就像下面这样的 JSON：

```python
{
  'typ': 'JWT',
  'alg': 'HS256'
}
```

然后将头部进行 base64 加密（该加密是可以对称解密的), 构成了第一部分.

```python
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9
```

#### Payload（有效载荷）

载荷就是存放有效信息的地方，其中包含claims。claims是关于实体（常用的是用户信息）和其他数据的声明，claims有三种类型：

- **Registered claims（注册的声明）：**    这些是一组预定义的claims，非强制性的，但是推荐使用， iss（发行人）， exp（到期时间）， sub（主题）， aud（观众）等；
- **Public claims（公共的声明）:**    自定义claims，注意不要和JWT注册表中属性冲突，[这里可以查看JWT标准注册表](https://www.iana.org/assignments/jwt/jwt.xhtml)
- **Private claims（私有的声明）:**    这些是自定义的claims，用于在同意使用这些claims的各方之间共享信息，它们既不是Registered claims，也不是Public claims。

##### 标准中注册的声明

> **建议但不强制使用**

* **iss**: jwt 签发者
* **sub**: jwt 所面向的用户
* **aud**: 接收 jwt 的一方
* **exp**: jwt 的过期时间，这个过期时间必须要大于签发时间，注意，这个值是秒数，而不是毫秒数。
* **nbf**: 定义在什么时间之前，该 jwt 都是不可用的.
* **iat**: jwt 的签发时间
* **jti**: jwt 的唯一身份标识，主要用来作为一次性 token, 从而回避重放攻击。
* **name**：用户全名

##### 公共的声明

公共的声明可以添加任何的信息，一般添加用户的相关信息或其他业务需要的必要信息. 但不建议添加敏感信息，因为该部分在客户端可解密。

##### 私有的声明

私有声明是提供者和消费者所共同定义的声明，**一般不建议存放敏感信息**，因为 base64 是对称解密的，意味着该部分信息可以归类为明文信息。

> 在官网有详细的属性说明，尽量使用里面提到的 *Registered Claim Names*，这样可以提高阅读性

自定义一个 payload:

```python
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```

然后将其进行 base64 加密，得到 Jwt 的第二部分。

```python
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9
```

#### signature

jwt 的第三部分是一个签证信息，这个签证信息由三部分组成：

* header (base64 后的)
* payload (base64 后的)
* secret

这个签名的计算跟第一部分中的 alg 属性有关，假如是 HS256，那么服务端需要保存一个私钥，比如 secret 。然后，把第一部分和第二部分生成的两个字符串用 `.` 连接之后，用 HS256 进行加盐`secret`加密，然后就构成了 jwt 的第三部分。

```python
TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

将这三部分用`.`连接成一个完整的字符串, 构成了最终的 jwt:

```python
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

> **注意：secret 是保存在服务器端的，jwt 的签发生成也是在服务器端的，secret 就是用来进行 jwt 的签发和 jwt 的验证，所以，它就是你服务端的私钥，在任何场景都不应该流露出去。一旦客户端得知这个 secret, 那就意味着客户端是可以自我签发 jwt 了。**

### JSON Web Encryption(JWE)

相对于JWS，JWE则同时保证了安全性与数据完整性。
JWE由五部分组成：

![](attachment/2c1874a0a7d342e4a7e2a938100795d3.webp)

我们来看看一个标准的JWE过程是怎样的：

- JOSE含义与JWS头部相同。
- 生成一个随机的Content Encryption Key （CEK）。
- 使用RSAES-OAEP 加密算法，用公钥加密CEK，生成JWE Encrypted Key。
- 生成JWE初始化向量。
- 使用AES GCM加密算法对明文部分进行加密生成密文Ciphertext,算法会随之生成一个128位的认证标记Authentication Tag。
- 对五个部分分别进行base64编码。

可见，JWE的计算过程相对繁琐，不够轻量级，因此适合与数据传输而非token认证，但该协议也足够安全可靠，用简短字符串描述了传输内容，兼顾数据的安全性与完整性。

总结
--

* 因为 json 的通用性，所以 JWT 是可以进行跨语言支持的，像 JAVA,JavaScript,NodeJS,Python 等很多语言都可以使用。
* 它不需要在服务端保存会话信息, 所以它易于应用的扩展。
