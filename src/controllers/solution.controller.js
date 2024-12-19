const Solution = require("../models/solution.model.js");


const findSolution = (req, res) => {

    const {
        Data_Modality, 
        Tasks, 
        Learning_Architecture, 
        Model_Architecture, 
        Knowledge, 
        Application_Domains 
    } = req.body;

    // Validate request
    if (!Data_Modality || !Tasks || !Learning_Architecture || 
        !Model_Architecture || !Knowledge || !Application_Domains) {
        res.status(400).send({
            message: "All fields are required!"
        });
        return;
    }

    Solution.findByCriteria(
        Data_Modality,
        Tasks,
        Learning_Architecture,
        Model_Architecture,
        Knowledge,
        Application_Domains, 
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "No solution found with given criteria"
                });
                return;
            }
            res.status(500).send({
                message: "Error retrieving solution"
            });
            return;
        }
       
        res.send(data);
    });
};
// search function according to Attack ID 
const findSolutionByAttackId = (req, res) => {
    const { Attack_ID } = req.body;

    // Validate request
    if (!Attack_ID) {
        res.status(400).send({
            message: "Attack ID is required!"
        });
        return;
    }

    Solution.findByAttackId(Attack_ID, 
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `No solution found with Attack ID: ${Attack_ID}`
                });
                return;
            }
            res.status(500).send({
                message: "Error retrieving solution"
            });
            return;
        }
       
        res.send(data);
    });
};

module.exports = {
    findSolution,
    findSolutionByAttackId,  //add new right display 
};

