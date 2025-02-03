const express = require('express'); // 引入express框架
const router = express.Router(); // 创建路由对象
const solutionController = require('../controllers/solution.controller'); // 引入解决方案控制器
const multer = require('multer'); // 引入文件上传中间件
const path = require('path'); // 引入path模块，用于处理文件路径
const axios = require('axios'); // 引入axios库，用于发送HTTP请求
const { exec } = require('child_process'); // 引入exec用于执行系统命令
const fs = require('fs');
const fsPromises = require('fs').promises;

// 确保在文件开头定义路径
const userModelsPath = process.env.USER_MODELS_PATH || 'D:\\Lee\\robust-ai\\User_Models';
const trainDatasetPath = process.env.TRAIN_DATASET_PATH || 'D:\\Lee\\robust-ai\\train_dataset';
const testDatasetPath = process.env.TEST_DATASET_PATH || 'D:\\Lee\\robust-ai\\test_dataset';

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

// 修改确保目录存在的函数
async function ensureDirectoryExists(directory) {
    try {
        // 使用同步方法检查目录是否存在
        if (!fs.existsSync(directory)) {
            // 使用异步方法创建目录
            await fsPromises.mkdir(directory, { recursive: true });
        }
    } catch (error) {
        console.error(`Error creating directory ${directory}:`, error);
        throw error;
    }
}

// 使用 async/await 确保目录创建
(async () => {
    try {
        await Promise.all([
            ensureDirectoryExists(userModelsPath),
            ensureDirectoryExists(trainDatasetPath),
            ensureDirectoryExists(testDatasetPath)
        ]);
    } catch (error) {
        console.error('Error ensuring directories exist:', error);
    }
})();

// 修改文件上传路由和 Multer 配置
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            // 从请求头中获取文件类型
            const fileType = req.headers['x-file-type'];
            console.log('File type from headers:', fileType);

            let uploadPath;
            if (fileType === 'model' && file.originalname.endsWith('.h5')) {
                uploadPath = userModelsPath;
            } else if (fileType === 'train_dataset' && file.originalname.endsWith('.csv')) {
                uploadPath = trainDatasetPath;
            } else if (fileType === 'test_dataset' && file.originalname.endsWith('.csv')) {
                uploadPath = testDatasetPath;
            } else {
                return cb(new Error(`Invalid file type or mismatch: ${fileType}`));
            }

            console.log('Selected upload path:', uploadPath);
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const fileType = req.headers['x-file-type'];
            const uniqueSuffix = Date.now();
            cb(null, `${fileType}-${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: function (req, file, cb) {
        const fileType = req.headers['x-file-type'];
        console.log('Processing file:', file.originalname, 'Type:', fileType);

        if (!fileType) {
            return cb(new Error('File type not specified'));
        }

        if (fileType === 'model' && !file.originalname.endsWith('.h5')) {
            return cb(new Error('Model file must be .h5 format'));
        }
        if ((fileType === 'train_dataset' || fileType === 'test_dataset') && !file.originalname.endsWith('.csv')) {
            return cb(new Error('Dataset file must be .csv format'));
        }
        cb(null, true);
    }
}).single('file');

// routes for left panel
router.post("/api/query-solution", solutionController.findSolution); // 查询解决方案的路由

// routes for right panel
router.post("/api/query-solution-right", solutionController.findSolutionByAttackId); // 根据攻击ID查询解决方案的路由

// 文件上传路由
router.post('/api/upload', (req, res) => {
    console.log('Upload request received, headers:', req.headers);
    
    upload(req, res, function(err) {
        console.log('Upload callback triggered');
        
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (!req.file) {
            console.log('No file received');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileType = req.headers['x-file-type'];
        const filePath = req.file.path;
        
        console.log('File uploaded successfully:', {
            file: req.file,
            type: fileType,
            path: filePath
        });

        res.json({
            success: true,
            message: `${fileType} uploaded successfully`,
            file: {
                originalName: req.file.originalname,
                savedAs: req.file.filename,
                size: req.file.size,
                path: filePath,
                type: fileType
            }
        });
    });
});

// 修改发送到Python的路由
router.post('/api/process', async (req, res) => {
    console.log('Processing request:', req.body);

    // 去掉文件名的后缀
    const uploadFileName = req.body.upload_file_name.replace(/\.h5$/, '');
    const requestData = {
        ...req.body,
        upload_file_name: uploadFileName
    };

    const axiosInstance = axios.create({
        baseURL: 'http://localhost:5000',
        timeout: 600000, // 10分钟超时
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
        }
    });

    try {
        console.log('Sending request to Python server with data:', requestData);
        const response = await axiosInstance.post('/process', requestData);
        console.log('Received response from Python server:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error in /api/process:', error);

        // 检查 Python 服务器是否在运行
        try {
            const healthResponse = await axiosInstance.get('/health');
            console.log('Python server health check:', healthResponse.data);
        } catch (healthError) {
            console.error('Python server health check failed:', healthError);
            return res.status(503).json({
                error: 'Python service is not available',
                details: 'Please ensure the Python server is running'
            });
        }

        // 其他错误处理
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || 'Internal server error';
        const errorDetails = error.response?.data?.details || error.message;

        res.status(statusCode).json({
            error: errorMessage,
            details: errorDetails,
            requestData: req.body
        });
    }
});

// 修改文件访问路由
router.get('/Attack_Results/:implementation_id/:filetype', async (req, res) => {
    try {
        const { implementation_id, filetype } = req.params;
        const baseDir = 'D:\\Lee\\robust-ai\\Attack_Results';
        let filename;
        
        if (filetype === 'json') {
            filename = `${implementation_id}.json`;
        } else if (filetype === 'png') {
            filename = `${implementation_id}.png`;
        } else {
            return res.status(400).send('Invalid file type');
        }

        const filePath = path.join(baseDir, filename);
        
        // 使用 fs.promises.access 检查文件是否存在
        try {
            await fsPromises.access(filePath);
        } catch (error) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).send(`File not found: ${filename}`);
        }
        
        if (filetype === 'json') {
            const data = await fsPromises.readFile(filePath, 'utf8');
            
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