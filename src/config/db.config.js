const mysql = require('mysql2'); // 引入mysql2库
require('dotenv').config(); // 加载环境变量配置

// 创建数据库连接
const connection = mysql.createConnection({
    host: process.env.DB_HOST, // 数据库主机
    user: process.env.DB_USER, // 数据库用户
    password: process.env.DB_PASSWORD, // 数据库密码
    database: process.env.DB_NAME // 数据库名称
});

// 连接数据库
connection.connect(error => {
    if (error) throw error; // 如果连接失败，抛出错误
    console.log("Successfully connected to the database."); // 连接成功时打印信息
});

module.exports = connection; // 导出数据库连接