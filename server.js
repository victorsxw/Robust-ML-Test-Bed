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