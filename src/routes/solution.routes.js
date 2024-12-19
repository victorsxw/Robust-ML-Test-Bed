const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solution.controller');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

// 打开结果文件夹的路由
router.post('/api/open-results-folder', (req, res) => {
    const folderPath = 'D:\\Lee\\robust-ai\\Attack_Results';

    exec(`explorer "${folderPath}"`, (error) => {
        if (error) {
            console.error('Error opening folder:', error);
            return res.json({ success: false, message: error.message });
        }
        res.json({ success: true });
    });
});


// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:\\Lee\\robust-ai\\User_Models') // 确保这个目录存在,\ 是转义字符。当你想表示一个文字反斜杠 \ 时，需要使用 \\
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)// 直接使用原始文件名
    }
});

const upload = multer({ storage: storage });

//  routes for left panel
router.post("/api/query-solution", solutionController.findSolution);

// routes for right panel
router.post("/api/query-solution-right", solutionController.findSolutionByAttackId);


// 文件上传路由
router.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ fileName: req.file.originalname });
});

// 发送到Python的路由
router.post('/api/process', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5000/process', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;