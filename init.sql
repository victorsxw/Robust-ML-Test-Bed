CREATE DATABASE IF NOT EXISTS Attack;
USE Attack;

-- 创建 attack 表
CREATE TABLE IF NOT EXISTS attack (
    ID VARCHAR(255) PRIMARY KEY,
    Attack_Type VARCHAR(255),
    Data_Modality VARCHAR(255),
    Tasks VARCHAR(255),
    Learning_Architectures VARCHAR(255),
    Model_Architectures VARCHAR(255),
    Knowledge VARCHAR(255),
    Application_Domains VARCHAR(255)
);

-- 创建 attacks_in_tools 表
CREATE TABLE IF NOT EXISTS attacks_in_tools (
    ID_in_the_Attack_sheet VARCHAR(255),
    Implementation_ID VARCHAR(255)
);

-- 这里可以添加初始数据
-- INSERT INTO attack VALUES (...);
-- INSERT INTO attacks_in_tools VALUES (...); 