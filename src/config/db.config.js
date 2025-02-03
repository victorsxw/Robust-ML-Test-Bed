const mysql = require('mysql2'); // 引入mysql2库
require('dotenv').config(); // 加载环境变量配置

function createConnection() {
    const connection = mysql.createConnection({
        host: process.env.IS_DOCKER === 'true' ? 'mysql' : 'localhost', // Docker环境使用服务名
        user: process.env.DB_USER, // 数据库用户
        password: process.env.DB_PASSWORD, // 数据库密码
        database: process.env.DB_NAME, // 数据库名称
        port: 3306
    });

    return new Promise((resolve, reject) => {
        const tryConnect = (retries = 5) => {
            connection.connect((error) => {
                if (error) {
                    console.error('Database connection failed:', error);
                    if (retries > 0) {
                        console.log(`Retrying... (${retries} attempts left)`);
                        setTimeout(() => tryConnect(retries - 1), 5000);
                    } else {
                        reject(error);
                    }
                } else {
                    console.log('Successfully connected to the database.');
                    resolve(connection);
                }
            });
        };

        tryConnect();
    });
}

// 导出 Promise 而不是直接导出 connection
module.exports = createConnection().then(connection => {
    // 返回一个包装了 connection 的对象，确保有 query 方法
    return {
        query: (sql, params) => {
            return new Promise((resolve, reject) => {
                connection.query(sql, params, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        }
    };
}).catch(error => {
    console.error('Failed to create database connection:', error);
    throw error;
});