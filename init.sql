-- 这个文件作为数据库结构的参考模板
CREATE DATABASE IF NOT EXISTS attack;
USE attack;

-- 创建表结构
CREATE TABLE IF NOT EXISTS attack (
    ID VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255),
    Attack_Types VARCHAR(255),
    Data_Modality VARCHAR(255),
    Tasks VARCHAR(255),
    Learning_Architectures VARCHAR(255),
    Model_Architectures VARCHAR(255),
    Knowledge VARCHAR(255),
    Application_Domains VARCHAR(255)
);

-- 创建 attacks_in_tools 表结构
CREATE TABLE IF NOT EXISTS attacks_in_tools (
    ID_in_the_Attack_sheet VARCHAR(255),
    Implementation_ID VARCHAR(255)
);

-- 注意：实际数据将从 init_dump.sql 导入
-- 这个文件仅作为数据库结构的参考 