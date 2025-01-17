const Solution = require("../models/solution.model.js");// 引入解决方案模型

// 查找解决方案的控制器即发送task1的查找条件到后端
const findSolution = (req, res) => {
   // 从请求体中解构出所需的字段
    const {
        Attack_Types,
        Data_Modality, 
        Tasks, 
        Learning_Architecture, 
        Model_Architecture, 
        Knowledge, 
        Application_Domains 
    } = req.body;

   // 验证请求是否包含所有必需字段
    if (!Attack_Types || !Data_Modality || !Tasks || !Learning_Architecture || 
        !Model_Architecture || !Knowledge || !Application_Domains) {
        res.status(400).send({// 返回400状态码和错误信息
            message: "All fields are required!"// 提示所有字段都是必需的
        });
        return; // 结束函数执行
    }
    // 调用模型方法查找符合条件的解决方案
    Solution.findByCriteria(
        Attack_Types,
        Data_Modality,
        Tasks,
        Learning_Architecture,
        Model_Architecture,
        Knowledge,
        Application_Domains, 
        (err, data) => {// 回调函数处理查询结果
        if (err) {// 如果发生错误
            if (err.kind === "not_found") {// 如果未找到结果
                res.status(404).send({// 返回404状态码和未找到信息
                    message: "No solution found with given criteria"
                });
                return;// 结束函数执行
            }
            res.status(500).send({// 返回500状态码和错误信息
                message: "Error retrieving solution"
            });
            return; // 结束函数执行
        }
       
        res.send(data);// 返回查询到的数据
    });
};

// 根据攻击ID查找解决方案的控制器，即task2的查询
const findSolutionByAttackId = (req, res) => {
    const { Attack_ID } = req.body; //从请求体中获取攻击ID

    // 验证请求是否包含攻击ID
    if (!Attack_ID) {
        res.status(400).send({ // 返回400状态码和错误信息
            message: "Attack ID is required!" // 提示攻击ID是必需的
        });
        return; // 结束函数执行
    }

    // 调用模型方法根据攻击ID查找解决方案
    Solution.findByAttackId(Attack_ID, 
        (err, data) => { // 回调函数处理查询结果
            if (err) { // 如果发生错误
                if (err.kind === "not_found") { // 如果未找到结果
                    res.status(404).send({ // 返回404状态码和未找到信息
                        message: `No solution found with Attack ID: ${Attack_ID}`
                    });
                    return; // 结束函数执行
                }
                res.status(500).send({ // 返回500状态码和错误信息
                    message: "Error retrieving solution"
                });
                return; // 结束函数执行
            }
           
            res.send(data); // 返回查询到的数据
        }
    );
};

// 导出控制器方法
module.exports = {
    findSolution, // 导出查找解决方案的方法task1
    findSolutionByAttackId,  // 导出根据攻击ID查找解决方案的方法task2
};

