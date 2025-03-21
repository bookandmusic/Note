---
title: 10-Docker Compose
createTime: 2025/03/21 22:12:18
permalink: /docker/b7kpgort/
---

Docker-Compose是Docker官方的开源项目，负责实现对Docker容器集群的快速编排。

docker建议我们每一个容器中只运行一个服务,因为docker容器本身占用资源极少,所以最好是将每个服务单独的分割开来。但是这样我们又面临了一个问题？

如果需要同时部署多个服务,难道要每个服务单独写Dockerfile然后在构建镜像,构建容器,这样累都累死了,所以docker官方给我们提供了docker-compose多服务部署的工具

例如要实现一个Web微服务项目，除了Web服务容器本身，往往还需要再加上后端的数据库mysql服务容器，redis服务器，注册中心eureka，甚至还包括负载均衡容器等等。。。。。。

Compose允许用户通过一个单独的 docker-compose.yml模板文件 （YAML 格式）来定义 一组相关联的应用容器为一个项目（project）。

可以很容易地用一个配置文件定义一个多容器的应用，然后使用一条指令安装这个应用的所有依赖，完成构建。Docker-Compose 解决了容器与容器之间如何管理编排的问题。

## 安装流程

Linux 上我们可以从 Github 上下载它的二进制包来使用，最新发行的版本地址：[https://github.com/docker/compose/releases](https://github.com/docker/compose/releases)。

运行以下命令以下载 Docker Compose 的当前稳定版本：

```shell
 sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

要安装其他版本的 Compose，请替换 版本号即可。

将可执行权限应用于二进制文件：

```
$ sudo chmod +x /usr/local/bin/docker-compose
```

创建软链：

```
$ sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

测试是否安装成功：

```
$ docker-compose version
cker-compose version 1.29.2, build 4667896b
```

## 核心概念

### 一文件

```shell
docker-compose.yml
```

### 两要素

```shell
服务(service):
一个个应用容器实例，比如订单微服务、库存微服务、mysql容器、nginx容器或者redis容器。

工程(project):
由一组关联的应用容器组成的一个完整业务单元，在 docker-compose.yml 文件中定义。
```

### 三个步骤

1. 编写Dockerfile定义各个微服务应用并构建出对应的镜像文件
2. 使用 docker-compose.yml 定义一个完整业务单元，安排好整体应用中的各个容器服务。
3. 最后，执行docker-compose up命令 来启动并运行整个应用程序，完成一键部署上线

### 常用命令

```shell
docker-compose -h                           #  查看帮助 
docker-compose build                     # 打包镜像
docker-compose up                           #  启动所有 docker-compose服务 
docker-compose up -d                        #  启动所有 docker-compose服务 并后台运行 
docker-compose down                         #  停止并删除容器、网络、卷、镜像。 
docker-compose exec  yml里面的服务id                 # 进入容器实例内部  docker-compose exec  docker-compose.yml文件中写的服务id  /bin/bash 
docker-compose ps                      # 展示当前docker-compose编排过的运行的所有容器 
docker-compose top                     # 展示当前docker-compose编排过的容器进程 
 
docker-compose logs  yml里面的服务id     #  查看容器输出日志 
docker-compose config     #  检查配置 
docker-compose config -q  #  检查配置，有问题才有输出 
docker-compose restart   #  重启服务 
docker-compose start     #  启动服务 
docker-compose stop      #  停止服务 
```

## Componse 编排服务

### web服务

#### 文件结构

```shell
$ tree .  
.
├── app
│   ├── Dockerfile
│   ├── app.py
│   └── requirements.txt
├── docker-compose.yml
├── mysql
│   ├── conf
│   │   └── mysql.conf
│   └── data
└── redis
    ├── conf
    │   └── redis.conf
    └── data
```

#### ​`app.py`​​

```python
from fastapi import FastAPI, HTTPException
import aioredis
import aiomysql
import logging

app = FastAPI()

# Redis configuration


async def get_redis_client():
    redis = aioredis.from_url(
        "redis://redis", encoding="utf-8", decode_responses=True
    )
    return redis


# MySQL configuration
async def get_mysql_pool():
    return await aiomysql.create_pool(
        host="mysql",
        user="root",
        password="password",
        db="mydb",
        autocommit=True,
    )

# Initialize database on service startup


async def initialize_database():
    try:
        mysql_pool = await get_mysql_pool()
        async with mysql_pool.acquire() as connection:
            async with connection.cursor() as cursor:
                await cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_visits (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        visit_count INT DEFAULT 0
                    )
                """)
    except aiomysql.Error as e:
        logging.error(f"Failed to initialize database: {e}")


@app.on_event("startup")
async def startup_event():
    await initialize_database()


async def get_user_visits():
    try:
        redis_client = await get_redis_client()
        user_visits = await redis_client.get("user_visits")
        if user_visits is not None:
            return int(user_visits)

        mysql_pool = await get_mysql_pool()
        async with mysql_pool.acquire() as connection:
            async with connection.cursor() as cursor:
                await cursor.execute("SELECT visit_count FROM user_visits")
                result = await cursor.fetchone()
                if result:
                    user_visits = result[0]
                else:
                    user_visits = 0

        await redis_client.set("user_visits", user_visits)
        return user_visits

    except (aioredis.RedisError, aiomysql.Error) as e:
        logging.error(f"Failed to get user visits: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/")
async def homepage():
    try:
        user_visits = await get_user_visits()
        user_visits += 1

        redis_client = await get_redis_client()
        await redis_client.set("user_visits", user_visits)

        return {"message": "Welcome to the homepage!", "user_visits": user_visits}
    except HTTPException as e:
        raise e


@app.get("/user_visits/")
async def get_user_visits_endpoint():
    try:
        user_visits = await get_user_visits()
        return {"user_visits": user_visits}
    except HTTPException as e:
        raise e
```

#### ​`requirements.txt`​​

```plaintext
fastapi
uvicorn
aioredis
aiomysql
cryptography
```

#### ​`Dockerfile`​

```dockerfile
# Use the official Python image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./requirements.txt requirements.txt
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && pip install -r requirements.txt

# Copy the source code into the container
COPY . .

# Expose the port the FastAPI service will listen on
EXPOSE 8000

# Command to run the FastAPI service
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

```

### 使用Compose

服务编排，一套带走，安排

#### ​`docker-componse.yml`​​

```yaml
version: "3"
services:
  fastapi:
    build:
      context: ./app
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app  # Mount the web service code directory
    depends_on:
      - redis
      - mysql

  redis:
    image: "redis:latest"
    ports:
      - "6379:6379"
    volumes:
      - ./redis/conf:/usr/local/etc/redis/  # Mount the Redis configuration file
      - ./redis/data:/data  # Mount the Redis data directory

  mysql:
    image: "mysql:latest"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: "password"
      MYSQL_DATABASE: "mydb"
      MYSQL_USER: 'liusf' 
      MYSQL_PASSWORD: 'liusf123' 
    ports: 
      - "3306:3306" 
    volumes:
      - ./mysql/conf:/etc/mysql/conf.d/  # Mount the MySQL configuration file
      - ./mysql/data:/var/lib/mysql  # Mount the MySQL data directory
    command: --default-authentication-plugin=mysql_native_password #解决外部无法访问 
```

#### 管理服务

打包镜像

```shell
$ docker-compose  -f docker-compose.yml build                              
redis uses an image, skipping
mysql uses an image, skipping
Building fastapi
[+] Building 15.6s (10/10) FINISHED                                                                                                          
 => [internal] load build definition from Dockerfile                                                                                      0.0s
 => => transferring dockerfile: 37B                                                                                                       0.0s
 => [internal] load .dockerignore                                                                                                         0.0s
 => => transferring context: 2B                                                                                                           0.0s
 => [internal] load metadata for docker.io/library/python:3.9-slim                                                                       15.4s
 => [1/5] FROM docker.io/library/python:3.9-slim@sha256:f4efbe5d1eb52c221fded79ddf18e4baa0606e7766afe2f07b0b330a9e79564a                  0.0s
 => [internal] load build context                                                                                                         0.0s
 => => transferring context: 174B                                                                                                         0.0s
 => CACHED [2/5] WORKDIR /app                                                                                                             0.0s
 => CACHED [3/5] COPY ./requirements.txt requirements.txt                                                                                 0.0s
 => CACHED [4/5] RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && pip install -r requirements.txt           0.0s
 => CACHED [5/5] COPY . .                                                                                                                 0.0s
 => exporting to image                                                                                                                    0.0s
 => => exporting layers                                                                                                                   0.0s
 => => writing image sha256:735268fa6c6c874af02e0be37b098c5f3032215d5787d0bbec78032c95b87582                                              0.0s
 => => naming to docker.io/library/docker-compose_fastapi 
```

后台启动所有服务

```shell
$ docker-compose -f docker-compose.yml up -d
Creating network "docker-compose_default" with the default driver
Creating docker-compose_redis_1 ... done
Creating docker-compose_mysql_1 ... done
Creating docker-compose_fastapi_1 ... done
```

测试服务

```shell
$ curl -v localhost:8000/          
*   Trying ::1...
* TCP_NODELAY set
* Connected to localhost (::1) port 8000 (#0)
> GET / HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/7.64.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< date: Sun, 30 Jul 2023 02:37:11 GMT
< server: uvicorn
< content-length: 55
< content-type: application/json
< 
* Connection #0 to host localhost left intact
{"message":"Welcome to the homepage!","user_visits":42}* Closing connection 0

$ curl -v localhost:8000/user_visits/     
*   Trying ::1...
* TCP_NODELAY set
* Connected to localhost (::1) port 8000 (#0)
> GET /user_visits/ HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/7.64.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< date: Sun, 30 Jul 2023 02:37:17 GMT
< server: uvicorn
< content-length: 18
< content-type: application/json
< 
* Connection #0 to host localhost left intact
{"user_visits":42}* Closing connection 0
```

‍
