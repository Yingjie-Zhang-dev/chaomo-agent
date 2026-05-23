const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 解析 multipart/form-data
function parseMultipart(buffer, boundary) {
    const parts = [];
    const boundaryBuffer = Buffer.from('--' + boundary);
    let start = 0;

    while (true) {
        const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
        if (boundaryIndex === -1) break;

        const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
        if (nextBoundaryIndex === -1) break;

        const partData = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);

        // 找到标题和内容的分隔点
        const headerEndIndex = partData.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) {
            start = nextBoundaryIndex;
            continue;
        }

        const headerStr = partData.slice(0, headerEndIndex).toString();
        const contentStart = headerEndIndex + 4;
        const contentEnd = partData.length - 2; // 去掉末尾的 \r\n

        // 解析 header
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);

        if (filenameMatch) {
            const name = nameMatch ? nameMatch[1] : 'file';
            const filename = filenameMatch[1];
            const content = partData.slice(contentStart, contentEnd);

            parts.push({
                name,
                filename,
                content
            });
        }

        start = nextBoundaryIndex;
    }

    return parts;
}

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 处理文件上传
    if (req.url === '/upload' && req.method === 'POST') {
        let body = [];

        req.on('data', chunk => {
            body.push(chunk);
        });

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(body);
                const contentType = req.headers['content-type'] || '';
                const boundaryMatch = contentType.match(/boundary=(.+)/);

                if (!boundaryMatch) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '无法解析上传数据' }));
                    return;
                }

                const boundary = boundaryMatch[1];
                const parts = parseMultipart(buffer, boundary);

                if (parts.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '未找到上传文件' }));
                    return;
                }

                const file = parts[0];
                const ext = path.extname(file.filename);
                const uniqueId = Date.now().toString() + crypto.randomBytes(4).toString('hex');
                const filename = uniqueId + ext;
                const filePath = path.join(UPLOAD_DIR, filename);

                fs.writeFileSync(filePath, file.content);

                const fileUrl = `http://localhost:${PORT}/uploads/${filename}`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    id: uniqueId,
                    url: fileUrl,
                    name: filename
                }));
            } catch (err) {
                console.error('Upload error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '上传失败' }));
            }
        });
        return;
    }

    // 静态文件服务 - 访问上传的文件
    if (req.url.startsWith('/uploads/')) {
        const filename = req.url.split('/uploads/')[1];
        const filePath = path.join(UPLOAD_DIR, decodeURIComponent(filename));

        if (fs.existsSync(filePath)) {
            const ext = path.extname(filename).toLowerCase();
            const contentTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };

            res.writeHead(200, {
                'Content-Type': contentTypes[ext] || 'application/octet-stream',
                'Cache-Control': 'max-age=31536000'
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('文件不存在');
        }
        return;
    }

    // 列出所有已上传文件
    if (req.url === '/files' && req.method === 'GET') {
        fs.readdir(UPLOAD_DIR, (err, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '读取失败' }));
                return;
            }

            const fileList = files.map(file => ({
                name: file,
                url: `http://localhost:${PORT}/uploads/${file}`,
                id: file.split('.')[0]
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fileList));
        });
        return;
    }

    // 健康检查
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // 首页
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head><title>文件服务器</title></head>
            <body>
                <h1>潮墨智能体 - 文件服务器</h1>
                <p>文件上传服务已启动</p>
                <p>上传目录: ${UPLOAD_DIR}</p>
                <p>访问地址: http://localhost:${PORT}/uploads/文件名</p>
            </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`文件服务器已启动: http://localhost:${PORT}`);
    console.log(`上传目录: ${UPLOAD_DIR}`);
});