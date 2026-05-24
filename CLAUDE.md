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
文生文.yml           # Dify workflow: text Q&A (墨老 - ink art knowledge teacher)
图生文.yml           # Dify workflow: image critique (art curator role)
图生图.yml           # Dify workflow: image-to-image generation (Seedream)
```

## API Configuration

API configuration is in `index.html` lines 837-858:
- `API_BASE`: Dify endpoint (currently cpolar tunnel: `http://1b693889.r39.cpolar.top/agent/v1`)
- `API_KEYS`: Three Dify App IDs for wen-sheng-wen, tu-sheng-wen, tu-sheng-tu

To change the endpoint, modify `API_BASE` and ensure Dify is accessible at that address.

## Key Implementation Details

- **Streaming responses** (文生文): Uses `response_mode: streaming` and reads SSE chunks from `data.answer` fields
- **Blocking responses** (图生图/图生文): Uses `response_mode: blocking` and parses JSON from response body
- **File uploads**: Images uploaded to `${API_BASE}/files/upload`, then referenced by `upload_file_id` in chat messages
- **Image extraction** (图生图): Parses markdown image syntax `![](url)` from the response text

## Feature Flow

1. **水墨知识站** (Wen Sheng Wen): User query → Dify (question classifier → knowledge retrieval → LLM) → Streaming text response
2. **作品交流馆** (Tu Sheng Wen): Image upload → Dify LLM with vision → Blocking text critique
3. **文创实训坊** (Tu Sheng Tu): Image upload + optional prompt → Dify LLM (vision) → Seedream tool → Generated image URL

## Dify Nginx 配置要点

修改 `C:/Users/zhang/Downloads/dify-main/docker/nginx/conf.d/default.conf.template` 中的 proxy_pass 时，如果 upstream 路径和请求路径不同，**必须显式指定目标路径后缀**：

```nginx
# 错误：保留完整请求路径 /agent/v1/xxx → api:5001/agent/v1/xxx (404)
location /agent/v1 {
    proxy_pass http://api:5001;
}

# 正确：重写路径 /agent/v1 → /v1
location /agent/v1 {
    proxy_pass http://api:5001/v1;
}

location /agent/files {
    proxy_pass http://api:5001/files;  # 同理
}
```

**常见坑**：Dify 的 nginx 模板中，`/agent/v1` 和 `/agent/files` 这类 location 如果只写 `proxy_pass http://api:5001` 不带后缀，会导致请求路径错误，返回 404/502。