# 潮墨智能体

一个基于水墨艺术风格的 AI 智能助手 Web 应用，提供水墨知识问答、作品评价和创意图像生成三大功能。

复制网址到浏览器访问（后续可能会更新）：
http://4c2f6a43.r7.cpolar.cn/agent/

## 功能介绍

### 水墨知识站
水墨艺术知识问答模块，连接 AI 知识库，回答关于水墨画技法、历史、鉴赏等问题。

### 作品交流馆
上传水墨作品图片，AI 会进行专业点评和鉴赏分析。

### 文创实训坊
上传参考图片并输入创作描述，AI 会生成新的水墨风格创意图像。

## 技术架构

- **前端**：纯 HTML/CSS/JS 单页应用，无需构建
- **AI 后端**：Dify 工作流平台
  - 文生文：水墨知识问答（流式输出）
  - 图生文：作品评价（同步输出）
  - 图生图：图像生成（同步输出，集成 Seedream）

## 快速开始

### 方式一：直接打开
双击 `index.html` 在浏览器中打开即可使用（需确保 Dify 服务可访问）。

### 方式二：本地服务
```bash
# Python 3
python -m http.server 8080

# 然后访问 http://localhost:8080
```

## 配置说明

编辑 `index.html` 中的 API 配置（大约第 1839 行）：

```javascript
// 配置 Dify API 地址
const API_BASE = 'http://your-dify-server/v1';

// Dify App API Keys
const API_KEYS = {
    'wen-sheng-wen': 'your-app-key-for-wen-sheng-wen',
    'tu-sheng-wen': 'your-app-key-for-tu-sheng-wen',
    'tu-sheng-tu': 'your-app-key-for-tu-sheng-tu'
};
```

### 部署 Dify 后端

1. 在 Dify 平台创建三个应用：
   - **文生文**：对话流应用，用于知识问答
   - **图生文**：对话流应用（带图片输入），用于作品评价
   - **图生图**：对话流应用（带图片输入+工具调用），用于图像生成

2. 导入 `文生文.yml`、`图生文.yml`、`图生图.yml` 工作流配置文件

3. 将 Dify 提供的 App API Keys 填入 `index.html`

4. 如果 Dify 部署在不同地址，需要同步修改 Nginx 反向代理配置

## 目录结构

```
chaomo-agent/
├── index.html          # 主应用页面
├── marked.min.js       # Markdown 渲染库
├── 文生文.yml           # 水墨知识问答工作流
├── 图生文.yml           # 作品评价工作流
├── 图生图.yml           # 图像生成工作流
└── README.md            # 项目说明文档
```

## 界面预览

应用采用水墨山水画风格设计，包含三个主要功能入口：
- 首页：水墨古风主界面，三个功能以圆形导航呈现
- 水墨知识站：输入问题获取水墨知识解答
- 作品交流馆：上传作品图片获取 AI 点评
- 文创实训坊：上传参考图+文字描述生成新图像

## 许可证

MIT License