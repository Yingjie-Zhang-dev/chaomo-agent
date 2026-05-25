# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

潮墨智能体 is a single-page web application for Chinese ink art (水墨) education and creative applications. It provides three AI-powered features via Dify workflows: knowledge Q&A, artwork critique, and creative image generation.

## Development

This is a pure static HTML/CSS/JS application - no build step required. Open `index.html` directly in a browser to run.

```bash
# Or serve locally
python -m http.server 8080
```

## Architecture

```
index.html          # Main SPA - all UI, logic, and API integration
marked.min.js       # Markdown rendering library
server.js           # File upload server (port 3001)
文生文.yml           # Dify workflow: text Q&A (墨老 - ink art knowledge teacher)
图生文.yml           # Dify workflow: image critique (art curator role)
图生图.yml           # Dify workflow: image-to-image generation (Seedream)
```

## API Configuration

API configuration is in `index.html` lines 1839-1846:
- `API_BASE`: `/agent/v1` (nginx proxy to Dify)
- File upload: `/agent/upload` (nginx proxy to server.js on localhost:3001)

## Key Implementation Details

- **Streaming responses** (文生文): Uses `response_mode: streaming` and reads SSE chunks from `data.answer` fields
- **Blocking responses** (图生图/图生文): Uses `response_mode: blocking` and parses JSON from response body
- **File uploads**: Images uploaded to Dify via `${API_BASE}/files/upload`, then referenced by `upload_file_id` in chat messages
- **User uploads**: Images saved via `server.js` on port 3001, accessed via nginx proxy `/agent/uploads`
- **Image extraction** (图生图): Parses markdown image syntax `![](url)` from the response text

## Feature Flow

1. **水墨知识站** (Wen Sheng Wen): User query → Dify (question classifier → knowledge retrieval → LLM) → Streaming text response
2. **作品交流馆** (Tu Sheng Wen): Image upload → Dify LLM with vision → Blocking text critique → Image saved via server.js
3. **文创实训坊** (Tu Sheng Tu): Image upload + optional prompt → Dify LLM (vision) → Seedream tool → Generated image URL

## Dify Nginx 配置要点

修改 `C:/Users/zhang/Downloads/dify-main/docker/nginx/conf.d/default.conf.template` 中的 proxy_pass 时，**必须显式指定目标路径后缀**：

```nginx
# API 代理
location /agent/v1 {
    proxy_pass http://api:5001/v1;  # ✓ 正确：重写路径
}

# 文件上传代理 - 转发到宿主机 server.js
# 注意：Docker 容器内 localhost 指向容器自己，需要用宿主机 IP
location /agent/upload {
    proxy_pass http://192.168.71.11:3001/upload;
    include proxy.conf;
}

location /agent/uploads {
    proxy_pass http://192.168.71.11:3001/uploads;
    include proxy.conf;
}

# 文件服务代理
location /agent/files {
    proxy_pass http://api:5001/files;
    include proxy.conf;
}
```

**常见坑**：`/agent/v1` 和 `/agent/files` 这类 location 如果只写 `proxy_pass http://api:5001` 不带后缀，会导致请求路径错误，返回 404/502。

## 文件服务器 (server.js)

- 运行在 `localhost:3001`
- 上传目录：`uploads/`
- 通过 nginx 代理供公网访问（cpolar 免费版只能暴露 80 端口）
- 启动命令：`node server.js`

## Deployment Notes

每次修改 `index.html` 后需要：
1. 复制到 Dify nginx 目录：`cp index.html "C:/Users/zhang/Downloads/dify-main/docker/volumes/certbot/www/"`
2. 重启 nginx：`docker restart docker-nginx-1`