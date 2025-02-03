//后端查询数据库的程序
const sql = require("../config/db.config.js"); // 引入数据库配置

const Solution = function(solution) {
    this.Attack_Types = solution.Attack_Types; // 初始化攻击类型
    this.Data_Modality = solution.Data_Modality; // 初始化数据模态
    this.Tasks = solution.Tasks; // 初始化任务
    this.Learning_Architecture = solution.Learning_Architecture; // 初始化学习架构
    this.Model_Architecture = solution.Model_Architecture; // 初始化模型架构
    this.Knowledge = solution.Knowledge; // 初始化知识
    this.Application_Domains = solution.Application_Domains; // 初始化应用领域
    this.Attack_ID = solution.Attack_ID; // 初始化攻击ID
};

// 根据条件查找解决方案 task1的结果
Solution.findByCriteria = async (
    Attack_Types,
    Data_Modality, 
    Tasks, 
    Learning_Architecture, 
    Model_Architecture, 
    Knowledge, 
    Application_Domains, 
    result
) => {
    try {
        const db = await require("../config/db.config.js");
        const res = await db.query(
            `SELECT DISTINCT ID,Name
             FROM attack.attack
             WHERE Attack_Types = CASE 
                                 WHEN ? = 'ALL' THEN Attack_Types
                                 ELSE ?
                                 END      
             AND Data_Modality = CASE 
                                WHEN ? = 'ALL' THEN Data_Modality
                                ELSE ?
                                END 
             AND Tasks = CASE 
                        WHEN ? = 'ALL' THEN Tasks
                        ELSE ?
                        END
             AND Learning_Architectures = CASE 
                                        WHEN ? = 'ALL' THEN Learning_Architectures
                                        ELSE ?
                                        END 
             AND Model_Architectures = CASE 
                                     WHEN ? = 'ALL' THEN Model_Architectures
                                     ELSE ?
                                     END
             AND Knowledge = CASE 
                           WHEN ? = 'ALL' THEN Knowledge
                           ELSE ?
                           END
             AND Application_Domains = CASE 
                                    WHEN ? = 'ALL' THEN Application_Domains
                                    ELSE ?
                                    END`,
            [
                Attack_Types, Attack_Types,           
                Data_Modality, Data_Modality,           
                Tasks, Tasks,                            
                Learning_Architecture, Learning_Architecture,  
                Model_Architecture, Model_Architecture,       
                Knowledge, Knowledge,                    
                Application_Domains, Application_Domains      
            ]
        );
        
        if (res.length) {
            console.log("Solution found: ", res);
            result(null, res);
            return;
        }
        
        result({ kind: "not_found" }, null);
    } catch (err) {
        console.error("Database query error: ", err);
        result(err, null);
    }
};

// 根据攻击ID查找解决方案task2的结果
Solution.findByAttackId = async (Attack_ID, result_right) => {
    try {
        console.log('Finding solutions for Attack_ID:', Attack_ID); // 添加日志
        const db = await require("../config/db.config.js");
        
        // 修改查询语句，确保表名和数据库名正确
        const query = `
            SELECT DISTINCT Implementation_ID
            FROM attack.attacks_in_tools
            WHERE ID_in_the_Attack_sheet = ?
        `;
        console.log('Executing query:', query, 'with params:', [Attack_ID]); // 添加日志
        
        const res = await db.query(query, [Attack_ID]);
        console.log('Query results:', res); // 添加日志

        if (res && res.length > 0) {
            console.log("Solutions found for Attack_ID:", Attack_ID, res);
            result_right(null, res);
            return;
        }

        console.log("No solutions found for Attack_ID:", Attack_ID); // 添加日志
        result_right({ kind: "not_found" }, null);
    } catch (err) {
        console.error("Database query error:", err);
        result_right(err, null);
    }
};
 
module.exports = Solution; // 导出Solution模型