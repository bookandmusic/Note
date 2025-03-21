---
title: FastAPI服务部署
createTime: 2024/07/18 11:21:16
permalink: /article/vuyj5pze/
tags:
  - FastAPI
  - Gunicorn
  - Uvicorn
  - Supervisor
  - Systemd
category: 网站开发
---

FastAPI 是一个基于 ASGI 的现代 Web 框架，它的性能优秀，具有高度的可伸缩性和响应速度快等特点。FastAPI 支持多种 ASGI 服务器和工作进程模型，其中最流行的 ASGI 服务器是 Uvicorn 和 Daphne，而 Gunicorn 则是最流行的 WSGI 服务器之一。下面是关于使用 Uvicorn 和 Gunicorn 的一些考虑因素：

1. Uvicorn

   Uvicorn 是一个基于 uvloop 和 httptools 的高性能 ASGI 服务器。它被认为是最快的 ASGI 服务器之一，能够处理大量的并发请求。Uvicorn 支持多个工作进程和自动化的重新加载，这使得它在高负载环境下非常可靠。Uvicorn 还可以与 Gunicorn 配合使用，使用 Gunicorn 的 worker 类型来运行 Uvicorn。
2. Gunicorn

   Gunicorn 是一个基于 Python 的 WSGI 服务器，它支持多个工作进程和多个线程，可以轻松处理大量的并发请求。Gunicorn 支持自动化的重新加载和启动失败自动重试，这使得它在生产环境中非常稳定。Gunicorn 也可以与 Uvicorn 配合使用，使用 Uvicorn 的 worker 类型来运行 Gunicorn。

在选择 Uvicorn 或 Gunicorn 时，您需要考虑以下因素：

1. 性能和可扩展性：如果您需要处理高负载的并发请求，并需要一个高性能的 ASGI 服务器，那么 Uvicorn 可能更适合您。
2. 生产环境的稳定性：如果您需要一个稳定的服务器来运行您的应用程序，并且能够自动重新加载和启动失败自动重试，那么 Gunicorn 可能更适合您。
3. 操作和管理：如果您更熟悉 WSGI 服务器，那么 Gunicorn 可能更容易操作和管理。如果您更熟悉 ASGI 服务器，那么 Uvicorn 可能更容易操作和管理

## FastAPI应用

下面是一个简单的示例，演示如何创建FastAPI 启动一个应用程序，并且代理静态文件：

1. 首先，确保您已经安装了 FastAPI：

   ```bash
   pip install fastapi
   ```
2. FastAPI 应用程序存储在一个名为 `main.py`​ 的文件中：

   ```python
   from fastapi import FastAPI

   app = FastAPI()

   @app.get("/")
   async def read_root():
       return {"Hello": "World"}
   ```
3. 如果您的应用程序包含静态文件，例如图像、CSS 或 JavaScript 文件，则可以使用 FastAPI 内置的静态文件处理程序提供这些文件。首先，将这些文件保存在一个名为 `static` 的目录中，该目录应该位于您的应用程序代码的根目录下。然后，在您的 FastAPI 应用程序代码中，使用以下代码启用静态文件处理程序：

   ```python
   from fastapi import FastAPI
   from fastapi.staticfiles import StaticFiles

   app = FastAPI()

   app.mount("/static", StaticFiles(directory="static"), name="static")

   @app.get("/")
   async def read_root():
       return {"Hello": "World"}
   ```

   在这个示例中，`StaticFiles` 中间件被挂载到 `/static` 路径上，使得以 `/static` 开头的请求可以被处理为静态文件请求。静态文件的路径将根据 `directory` 参数指定的目录进行解析。

## 启动服务

### 开发环境

在开发环境中，可以不考虑稳定因素，直接使用uvicorn 服务器运行 FastAPI 应用程序

1. 安装 Gunicorn 和 Uvicorn：

   ```bash
   pip install uvicorn
   ```
2. 在命令行中运行以下命令来启动 Uvicorn：

   ```bash
   uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000 --log-level warning
   ```

   这将使用 uvicorn 服务器运行 FastAPI 应用程序，监听 0.0.0.0:8000 的所有传入请求，并使用 4 个 worker 处理并发请求。

### 生产环境

生产环境中，除了考虑性能，还需要考虑稳定性，因此可以使用 Gunicorn 来管理 Uvicorn， Gunicorn 的 `uvicorn`​ worker 类型，它允许您在 Gunicorn 中启动 Uvicorn。

以下是使用 Gunicorn 和 Uvicorn 部署 FastAPI 应用的步骤：

1. 安装 Gunicorn 和 Uvicorn：

   ```bash
   pip install gunicorn uvicorn
   ```
2. 在命令行中运行以下命令来使用 Gunicorn 启动 Uvicorn：

   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --log-level warning
   ```

   该命令将使用 Gunicorn 启动 Uvicorn，使用 4 个工作进程处理请求，并在端口 8000 上监听连接。

## 管理服务

如果您需要将应用程序部署到生产环境中，请使用 systemd 或 supervisord 等工具将 Gunicorn 作为服务运行，并将日志记录到日志文件中。

#### supervisor

Supervisor 是一个进程监控工具，可以轻松管理和监控多个进程。在这里，我们将使用 Supervisor 监控上面的 FastAPI 应用程序并将日志记录到文件中。

1. 安装 Supervisor：

   ```bash
   sudo apt-get install supervisor
   ```
2. 编辑 Supervisor 的配置文件：

   ```bash
   sudo nano /etc/supervisor/conf.d/fastapi.conf
   ```

   在此文件中添加以下内容：

   ```ini
   [program:fastapi]
   command=/path/to/virtualenv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --log-level warning
   directory=/path/to/your/app
   user=your_user
   autostart=true
   autorestart=true
   stderr_logfile=/var/log/fastapi.err.log
   stdout_logfile=/var/log/fastapi.out.log
   ```

   在这里，`[program:fastapi]` 是一个程序的名称，可以随意设置。`command` 是运行 FastAPI 应用程序的命令，您可以将其替换为您的命令。`directory` 是应用程序代码所在的目录。`user` 是应用程序运行的用户。`autostart` 和 `autorestart` 用于控制进程的启动和重启。`stderr_logfile` 和 `stdout_logfile` 用于将错误日志和标准输出日志记录到文件中。
3. 保存并关闭文件。重新加载 Supervisor 配置文件：

   ```bash
   sudo supervisorctl reread
   sudo supervisorctl update
   ```

   这将重新加载配置文件并启动 FastAPI 应用程序。
4. 检查 FastAPI 应用程序是否正在运行：

   ```bash
   sudo supervisorctl status
   ```

   如果一切正常，您应该看到类似于以下内容的输出：

   ```ruby
   fastapi RUNNING pid XXXX, uptime XX:XX:XX
   ```

   如果出现错误，请检查 `stderr_logfile` 中的日志文件以获取更多信息。
5. 检查日志文件是否正常工作：

   您可以通过查看 `/var/log/fastapi.err.log` 和 `/var/log/fastapi.out.log` 中的内容来查看 FastAPI 应用程序的错误日志和标准输出日志。

   ```bash
   tail -f /var/log/fastapi.err.log
   tail -f /var/log/fastapi.out.log
   ```

   `tail -f` 命令将实时显示日志文件中的内容。

#### systemd

以下是一个示例 systemd 配置文件：

```ini
[Unit]
Description=Gunicorn instance to serve myproject
After=network.target

[Service]
User=username
Group=www-data
WorkingDirectory=/path/to/myproject
Environment="PATH=/path/to/virtualenv/bin"
ExecStart=/path/to/virtualenv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --log-level warning
Restart=always
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

您需要将该文件保存为 `/etc/systemd/system/myproject.service`，并运行以下命令启动服务：

```bash
systemctl daemon-reload
systemctl start myproject
systemctl enable myproject
```

日志可以在 `/var/log/syslog` 或 `/var/log/myproject.log` 中找到，具体取决于您的配置。

## nginx反向代理

最后，您可以使用反向代理工具，例如 Nginx 或 Apache，来将传入的 HTTP 请求路由到您的 FastAPI 应用程序。在 Nginx 中，您可以使用类似于以下的配置文件将请求路由到 FastAPI：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
```

## ‍总结

总的来说，Uvicorn 是一个快速、可扩展的 ASGI 服务器，适合处理高负载的并发请求，而 Gunicorn 是一个稳定的 WSGI 服务器，适合在生产环境中运行。如果您需要同时使用这两个服务器，那么可以考虑使用 Gunicorn 来管理 Uvicorn。
