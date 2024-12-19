const sql = require("../config/db.config.js");

const Solution = function(solution) {
    this.Data_Modality = solution.Data_Modality;
    this.Tasks = solution.Tasks;
    this.Learning_Architecture = solution.Learning_Architecture;
    this.Model_Architecture = solution.Model_Architecture;
    this.Knowledge = solution.Knowledge;
    this.Application_Domains = solution.Application_Domains;
    this.Attack_ID = solution.Attack_ID; 
};

Solution.findByCriteria = (
    Data_Modality, 
    Tasks, 
    Learning_Architecture, 
    Model_Architecture, 
    Knowledge, 
    Application_Domains, 
    result
) => {
    sql.query(
        `SELECT DISTINCT ID 
         FROM attack.attack
         WHERE Data_Modality =          CASE 
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
            Data_Modality, Data_Modality,           
            Tasks, Tasks,                            
            Learning_Architecture, Learning_Architecture,  
            Model_Architecture, Model_Architecture,       
            Knowledge, Knowledge,                    
            Application_Domains, Application_Domains      
        ],
        (err, res) => {
            if (err) {
                console.error("Database query error: ", err);
                result(err, null);
                return;
            }

            if (res.length) {
                console.log("Solution found: ", res); // Print request results
                result(null, res);
                return;
            }

            result({ kind: "not_found" }, null);
        }
    );
};

// the solution of searching based on Attack ID
Solution.findByAttackId = (Attack_ID, result_right) => {
    sql.query(
        `SELECT DISTINCT Implementation_ID
         FROM Attack.attacks_in_tools
         WHERE ID_in_the_Attack_sheet = ?`,
        [Attack_ID],
        (err, res) => {
            if (err) {
                console.error("Database query error: ", err);
                result_right(err, null);
                return;
            }

            if (res.length) {
                console.log("Solution found by Attack ID: ", res);
                result_right(null, res);
                return;
            }

            result_right({ kind: "not_found" }, null);
        }
    );
};

module.exports = Solution;