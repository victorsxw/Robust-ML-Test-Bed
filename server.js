const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require('node-fetch');
const multer = require('multer');

const app = express();

//  middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建上传目录
const fs = require('fs');
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 静态文件服务 - Attack_Results 目录
app.use('/app/Attack_Results', express.static('/app/Attack_Results', {
    setHeaders: (res, path) => {
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));

// 结果文件路由处理 - 支持大小写不敏感的文件匹配
app.get('/app/Attack_Results/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('/app/Attack_Results', filename);
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 尝试不同的大小写组合
            const dir = '/app/Attack_Results';
            fs.readdir(dir, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return res.status(404).send('File not found');
                }
                
                // 查找匹配的文件（不区分大小写）
                const matchingFile = files.find(file => 
                    file.toLowerCase() === filename.toLowerCase()
                );
                
                if (matchingFile) {
                    res.sendFile(path.join(dir, matchingFile));
                } else {
                    res.status(404).send('File not found');
                }
            });
        } else {
            res.sendFile(filePath);
        }
    });
});

// set static file directory
app.use(express.static(path.join(__dirname, 'public')));

// import route
const solutionRouter = require('./src/routes/solution.routes');
app.use('/', solutionRouter);

// add root route process
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// error process
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// run server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
});