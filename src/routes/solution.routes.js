const express = require('express'); // 引入express框架
const router = express.Router(); // 创建路由对象
const solutionController = require('../controllers/solution.controller'); // 引入解决方案控制器
const multer = require('multer'); // 引入文件上传中间件
const path = require('path'); // 引入path模块，用于处理文件路径
const axios = require('axios'); // 引入axios库，用于发送HTTP请求
const { exec } = require('child_process'); // 引入exec用于执行系统命令
const fs = require('fs').promises; // 添加 fs 模块

// 打开结果文件夹的路由
router.post('/api/open-results-folder', (req, res) => {
    const folderPath = 'D:\\Lee\\robust-ai\\Attack_Results'; // 定义要打开的文件夹路径

    exec(`explorer "${folderPath}"`, (error) => { // 执行命令打开文件夹
        if (error) { // 如果发生错误
            console.error('Error opening folder:', error); // 打印错误信息
            return res.json({ success: false, message: error.message }); // 返回失败响应
        }
        res.json({ success: true }); // 返回成功响应
    });
});

// 配置文件上传
const storage = multer.diskStorage({ // 创建存储配置
    destination: function (req, file, cb) { // 设置文件存储路径
        cb(null, 'D:\\Lee\\robust-ai\\User_Models'); // 确保这个目录存在
    },
    filename: function (req, file, cb) { // 设置文件名
        cb(null, file.originalname); // 直接使用原始文件名
    }
});

const upload = multer({ storage: storage }); // 创建上传中间件

// routes for left panel
router.post("/api/query-solution", solutionController.findSolution); // 查询解决方案的路由

// routes for right panel
router.post("/api/query-solution-right", solutionController.findSolutionByAttackId); // 根据攻击ID查询解决方案的路由

// 文件上传路由
router.post('/api/upload', upload.single('file'), (req, res) => { // 处理单个文件上传
    res.json({ fileName: req.file.originalname }); // 返回上传的文件名
});

// 发送到Python的路由
router.post('/api/process', async (req, res) => { // 处理发送到Python的请求
    try {
        const response = await axios.post('http://localhost:5000/process', req.body); // 发送POST请求到Python服务
        res.json(response.data); // 返回Python服务的响应数据
    } catch (error) { // 捕获错误
        res.status(500).json({ error: error.message }); // 返回错误信息
    }
});

// 修改文件访问路由
router.get('/Attack_Results/:implementation_id/:filetype', async (req, res) => {
    try {
        const { implementation_id, filetype } = req.params;
        const baseDir = 'D:\\Lee\\robust-ai\\Attack_Results';
        let filename;
        
        // 根据文件类型确定完整文件名
        if (filetype === 'json') {
            filename = `${implementation_id}.json`;
        } else if (filetype === 'png') {
            filename = `${implementation_id}.png`;
        } else {
            return res.status(400).send('Invalid file type');
        }

        const filePath = path.join(baseDir, filename);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).send(`File not found: ${filename}`);
        }
        
        // 设置正确的 Content-Type 并发送文件
        if (filetype === 'json') {
            const data = await fs.readFile(filePath, 'utf8');
            
            // 查找包含关键信息的行
            const lines = data.split('\n');
            const summaryLine = lines.find(line => {
                try {
                    const parsed = JSON.parse(line);
                    return parsed.message && parsed.message.includes('Attack type with max AUC:');
                } catch (e) {
                    return false;
                }
            });

            if (summaryLine) {
                try {
                    const parsed = JSON.parse(summaryLine);
                    // 只返回消息部分，不包含时间戳和级别
                    res.json({ messages: [parsed.message] });
                } catch (e) {
                    res.json({ messages: ['Error parsing summary data'] });
                }
            } else {
                res.json({ messages: ['Summary information not found'] });
            }
        } else {
            res.setHeader('Content-Type', 'image/png');
            res.sendFile(filePath);
        }
    } catch (error) {
        console.error('File access error:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router; // 导出路由