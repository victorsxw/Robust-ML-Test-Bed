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
Solution.findByCriteria = (
    Attack_Types,
    Data_Modality, 
    Tasks, 
    Learning_Architecture, 
    Model_Architecture, 
    Knowledge, 
    Application_Domains, 
    result // 回调函数，用于返回结果
) => {
    sql.query(
        `SELECT DISTINCT ID,Name
         FROM attack.attack
         WHERE Attack_Types =            CASE 
                                        WHEN ? = 'ALL' THEN Attack_Types
                                        ELSE ?
                                        END      
         AND Data_Modality =            CASE 
                                        WHEN ? = 'ALL' THEN Data_Modality
                                        ELSE ?
                                        END 
         AND Tasks =                    CASE 
                                        WHEN ? = 'ALL' THEN Tasks
                                        ELSE ?
                                        END
         AND Learning_Architectures =   CASE 
                                        WHEN ? = 'ALL' THEN Learning_Architectures
                                        ELSE ?
                                        END 
         AND Model_Architectures =      CASE 
                                        WHEN ? = 'ALL' THEN Model_Architectures
                                        ELSE ?
                                        END
         AND Knowledge =                CASE 
                                        WHEN ? = 'ALL' THEN Knowledge
                                        ELSE ?
                                        END
         AND Application_Domains =      CASE 
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
        ],
        (err, res) => { // 处理查询结果
            if (err) {
                console.error("Database query error: ", err); // 打印数据库查询错误
                result(err, null); // 返回错误
                return;
            }

            if (res.length) { // 如果查询结果不为空
                console.log("Solution found: ", res); // 打印找到的解决方案
                result(null, res); // 返回结果
                return;
            }

            result({ kind: "not_found" }, null); // 如果没有找到结果，返回未找到的状态
        }
    );
};

// 根据攻击ID查找解决方案task2的结果
Solution.findByAttackId = (Attack_ID, result_right) => {
    sql.query(
        `SELECT DISTINCT Implementation_ID
         FROM Attack.attacks_in_tools
         WHERE ID_in_the_Attack_sheet = ?`, // 根据攻击ID进行查询
         [Attack_ID], // 查询参数
         (err, res) => { // 处理查询结果
             if (err) {
                 console.error("Database query error: ", err); // 打印数据库查询错误
                 result_right(err, null); // 返回错误
                 return;
             }
 
             if (res.length) { // 如果查询结果不为空
                 console.log("Solution found by Attack ID: ", res); // 打印找到的解决方案
                 result_right(null, res); // 返回结果
                 return;
             }
 
             result_right({ kind: "not_found" }, null); // 如果没有找到结果，返回未找到的状态
         }
     );
 };
 
 module.exports = Solution; // 导出Solution模型