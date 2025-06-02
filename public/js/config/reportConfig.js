// Report Generator Configuration
const ReportConfig = {
    // 报告基本信息
    reportInfo: {
        title: 'Exploitation Assessment Report',
        reportNumberPrefix: 'EA REPORT NO.',
        footerText: '© Robust ML Test Bed',
        logo: '/images/logo.png'
    },
    
    // 报告各部分标题配置
    sectionTitles: {
        purpose: '1. Purpose',
        clientProfiles: '2. Client Profiles',
        robustnessAssessment: '3. Robustness Assessment',
        results: '4. Assessment Results',
        conclusions: '5. Conclusions'
    },
    
    // 静态内容配置
    staticContent: {
        purpose: 'This is an exploitation assessment report for assessing the security performance of users\' uploaded ML/DL models',
        clientProfilesIntro: 'The following information is provided by the Client',
        robustnessAssessment: {
            overview: 'The proposed framework offers a model-agnostic approach with a knowledge base of privacy attacks and defences, a dynamic assessment engine, and multiple metrics to evaluate the privacy risks of machine learning models',
            knowledgeBase: 'A structured knowledge base that systematically catalogues attack and defence methods from academic literature, incorporating their associated threat models, data modalities, tasks, and application domains.',
            assessmentFramework: 'A framework for evaluating the privacy risks of ML models, consisting of three key components: a user interface for data interaction, a dispatcher and assessment engine that dynamically matches models with appropriate privacy attack methods, and a container pool for executing attacks on user-uploaded models.',
            assessmentToolsIntro: 'The following tools are used in the assessment process:',
            evaluationMetricsIntro: 'The following metrics are used to evaluate the assessment results:',
            assessmentTools: [
                {
                    name: "TensorFlow Privacy",
                    description: "An open-source library developed by Google to integrate Differential Privacy (DP) into TensorFlow-based machine learning models",
                    developer: "Google",
                    activity: "YES",
                    attackMethods: "Membership Inference Attack(LogisticReg, Perceptron, Random Forest, k-nearest Neighbors, Threshold Attack, Threshold Entropy Attack)"
                },
                {
                    name: "Adversarial Robustness Toolbox (ART)",
                    description: "A library that offers various techniques for model security and inference privacy attacks, enabling the evaluation of privacy risks in ML models",
                    developer: "IBM",
                    activity: "YES",
                    attackMethods: "Evasion Attacks, Poisoning Attacks, Backdoor Attacks, Model Inversion Attack, Attribute Inference Attack, Database Reconstruction Attack"
                },
                {
                    name: "Privacy Meter",
                    description: "An open-source library designed for evaluating data privacy in ML models, specifically assessing MIA risks",
                    developer: "NUS Data Privacy & Trustworthy Machine Learning Lab",
                    activity: "YES",
                    attackMethods: "Membership Inference Attack (black-box, white-box)"
                }
            ]
        },
        evaluationMetrics: [
            {
                type: "Membership Inference Attacks (MIAs)",
                metrics: [
                    "Attack Success Rate (ASR)",
                    "Attack Precision (AP)",
                    "Attack Recall (AR)",
                    "Attack False Positive Rate (FPR)",
                    "Membership Advantage (MA)",
                    "Attack F1-score",
                    "AUC (Area Under the Receiver Operating Characteristic curve)",                    
                ]
            },
            {
                type: "Property Inference Attacks (PIAs)",
                metrics: [
                    "Accuracy",
                    "AUC",
                ]
            },
            {
                type: "Reconstruction Attacks (RAs)",
                metrics: [
                    "Accuracy",
                    "F1-score",                    
                ]
            },
            {
                type: "Model Extraction Attacks (MEAs)",
                metrics: [
                    "Accuracy",
                    "Fidelity",                    
                ]
            },
            {
                type: "Poisoning and Backdoor Attacks",
                metrics: [
                    "Clean Accuracy(CA)",
                    "Attack Success Rate (ASR)",                    
                ]
            },
            {
                type: "Evasion Attacks",
                metrics: [
                    "Clean Accuracy(CA)",
                    "Robust Accuracy(RS)"
                ]
            }
        ],
        methodologyOverview: [
            'Knowledge Base Test Bed: The assessment is based on well-established knowledge bases, incorporating state-of-the-art techniques to evaluate ML security and privacy risks.',
            'Methodology: The methodology includes empirical testing of security vulnerabilities and consistency validation using attack simulations.'
        ],
        privacyFramework: {
            objective: 'Ensuring consistency of security risks and empirical evaluation of vulnerabilities.',
            steps: [
                'Perform targeted adversarial and privacy attacks.',
                'Analyze privacy leakage and attack success rates.',
                'Summarize findings and provide security recommendations.'
            ],
            limitations: 'While our methodology follows empirical testing principles, certain attack techniques and evolving adversarial methods may not be fully covered.'
        }
    },
    
    // 文件资源路径配置
    paths: {
        results: '/app/Attack_Results',
        images: '/assets/images'
    },
    
    // 报告样式配置
    styles: {
        primaryColor: '#1a73e8',
        secondaryColor: '#34a853',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff'
    },
    
    // 图片资源配置
    images: {
        architectureDiagram: '/images/report/archi.png'  // 添加架构图路径
    }
};

// 导出配置
export default ReportConfig; 