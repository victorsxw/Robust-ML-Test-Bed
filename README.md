###NOTE：This program is the user interface component of the testbed only. The various images in the backend Docker containers (including TensorFlow Privacy, Pytorch, Privacy meter, and Adversarial Robustness Toolbox (ART)), along with the analysis scripts（Privacy Attack，Evasion Attack， Poison Attack， etc） and sample models for version 1.0, are all deployed and run on an internal system（User guide https://github.com/victorsxw/Robust-ML-Test-Bed/blob/main/User%20Guide.pdf）. As the project is still in progress, it is not currently available for external use.




### **Final Project Report: Robust-ML-Testbed**

**Version:** 1.0
**Date:** 2025-08-08

---

### **Table of Contents**

* Abstract
* 1. Introduction
    * 1.1. Background and Motivation
    * 1.2. Project Goals and Objectives
    * 1.3. Report Structure
* 2. Literature Review
* 3. System Design & Implementation
    * 3.1. Architecture Overview
    * 3.2. Key Implementation Details
    * 3.3. Technology Stack
    * 3.4 Testbed User Interface Introduction
* 4. Testing & Results Analysis
    * 4.1. Testing Methodology
    * 4.2. Key Test Results
    * 4.3. Integrated Case Study: Robustness Assessment of Machine Learning Models under Membership Inference Attacks
* 5. Problems Encountered and Solutions
* 6. Conclusion and Future Work
    * 6.1. Conclusion
    * 6.2. Future Work
* 7. References

---

### **Abstract**

The rapid deployment of machine learning (ML) models necessitates a rigorous evaluation of their robustness against adversarial threats. This report details the design, implementation, and validation of the **Robust-ML-Testbed**, a web-based platform for robustness assessment. The system uses a multi-container microservice architecture orchestrated with Docker Compose. It includes a user-friendly frontend, a Node.js backend for request and file management, a Flask backend for executing ML attack simulations, and a MySQL database for persistent storage. Users can upload models and datasets, configure attack parameters, run evaluations, and view results through automated reports. The platform was validated through systematic testing, including a case study on **membership inference attacks (MIAs)** that compared a baseline model with a differentially private (DP) model variant. The results show that the testbed effectively supports privacy-focused evaluations and can quantify improvements when defense mechanisms are used. This report outlines the system's design, implementation, testing methodology, results, challenges, and future enhancements.

---

### **1. Introduction**

#### **1.1. Background and Motivation**

Machine learning models, particularly deep neural networks, have had great success in many fields. However, their vulnerability to various adversarial attacks poses significant security and privacy risks. These attacks include:
* **Evasion attacks:** Subtle input changes cause misclassification.
* **Poisoning attacks:** Training data is manipulated to degrade performance or add backdoors.
* **Model extraction attacks:** The model is stolen or cloned.
* **Privacy attacks:** Sensitive information from the training dataset is leaked.

Ensuring the robustness and reliability of these models is crucial. Evaluating this often requires specialized tools and complex setups. The **Robust-ML-Testbed** was developed to address this need, providing an accessible, integrated platform for users to easily test their models against common adversarial attacks without needing deep expertise in attack implementation or environment setup. The platform's flexibility is further demonstrated through integrated case studies, such as assessments of privacy vulnerabilities like membership inference attacks.

---

### **1.2. Project Goals and Objectives**

The main goal of this project was to design and implement a functional web-based testbed for evaluating ML model robustness. The specific objectives were:
* Develop a user-friendly interface for uploading ML models and datasets.
* Implement functionality to configure and execute selected adversarial attacks.
* Integrate backend services to handle file management, task orchestration, and ML computations.
* Use containerization (Docker) for easy deployment and environment consistency.
* Provide clear visualizations of test results and metrics.
* Generate summary reports of the test configurations and outcomes.
* Validate the platform's generalizability through case studies, such as comparing base and defended models under privacy attacks.

#### **1.3. Report Structure**

This report is organized as follows:
* **Section 2** provides a brief literature review on ML robustness and adversarial attacks.
* **Section 3** details the system design and implementation.
* **Section 4** describes the testing procedures and analyzes the key results, including a case study on membership inference attacks.
* **Section 5** discusses the challenges faced and the solutions used to overcome them.
* **Section 6** concludes the report, summarizing achievements and suggesting future work.

---

### **2. Literature Review**

Adversarial attacks on ML models aim to exploit vulnerabilities, causing them to make incorrect predictions with high confidence. Research in this area has expanded rapidly since the introduction of FGSM (Fast Gradient Sign Method) by Szegedy et al. and Goodfellow et al.. Attacks can be broadly categorized by an adversary's knowledge (white-box, black-box), specificity (targeted vs. non-targeted), and domain (e.g., computer vision, natural language processing).

Common white-box attacks, which assume full knowledge of the model, include gradient-based methods like FGSM, Basic Iterative Method (BIM)/Projected Gradient Descent (PGD), and Carlini & Wagner (C&W) attacks. Black-box attacks often rely on query-based strategies or transferability from substitute models. Robustness is typically evaluated by measuring model performance on adversarial examples created by these attacks. Several libraries facilitate these evaluations, including CleverHans, Foolbox, and IBM's Adversarial Robustness Toolbox (ART). Privacy-preserving ML techniques, such as those in TensorFlow Privacy, also intersect with robustness, as methods like differential privacy can impact a model's resilience. **Membership inference attacks (MIAs)**, a key focus of the integrated case study, allow adversaries to determine if specific data points were used in training, highlighting privacy risks. This project builds on these concepts by providing an integrated environment for model hosting, attack execution, and results reporting, with a focus on user accessibility.

---

### **3. System Design & Implementation**

#### **3.1. Architecture Overview**

The Robust-ML-Testbed operates on the principle of "one input, dynamic matching of available attacks, and one-time generation of comprehensive assessment results". The system architecture consists of four primary, containerized services managed by Docker Compose:

* **Frontend (Web Service):** A user-facing interface built with HTML, CSS, and vanilla JavaScript. It allows users to upload models and datasets, select attack parameters, and view reports.
* **Backend API (Node.js/Express):** This acts as the main gateway, serving the frontend, handling HTTP requests, managing file uploads, and delegating analysis tasks to the Flask backend.
* **Analysis Engine (Python/Flask):** The core processing unit. It receives tasks, dynamically launches the appropriate attack container, executes ML attack scripts, and returns results.
* **Database (MySQL):** Provides persistent storage for attack configurations, test results, and a knowledge base of attack/defense mechanisms.

This microservice architecture, shown in **Fig. 1**, ensures modularity and scalability by separating the complex Python ML environments from the main web application logic. This design improves system resilience and simplifies maintenance.

![Fig. 1. The Framework Architecture of The Robust-ML-Testbed](https://i.imgur.com/k6lP0Wn.png)

---

#### **3.2. Key Implementation Details**

**3.2.1. Knowledge Base and Dynamic Attack Matching**

A key feature is a comprehensive knowledge base implemented in MySQL. This database was built from a literature review of ML robustness frameworks and software, surveying privacy attacks (like Membership Inference, Property Inference, and Reconstruction Attacks) and defenses (e.g., Differential Privacy, Homomorphic Encryption). The knowledge base catalogs attack and defense methods from academic literature, including associated threat models, data modalities, tasks, learning architectures, model architectures, knowledge levels, and application domains. It also integrates information on supporting libraries like TensorFlow Privacy, Privacy Meter, and ART.

The system queries this knowledge base based on user-selected model profiles (e.g., Attack Types, Data Modality) to dynamically suggest the most relevant attack vectors. For example, when a user specifies privacy-focused profiles, the Flask backend retrieves matching attacks from the knowledge base, which is particularly useful for privacy evaluations like MIAs.

**3.2.2. Containerized Attack Execution**

The system uses a "one container, one tool" approach, with each major attack library (e.g., TensorFlow Privacy, ART) encapsulated in its own Docker image. The Flask backend acts as a scheduler, launching the needed container on demand. This offers several advantages:

* **Environment Isolation:** Prevents dependency conflicts between different ML libraries, ensuring reliable and consistent attack executions.
* **Scalability:** Allows for parallel execution of different attacks, improving efficiency when evaluating large models or running comprehensive tests.
* **Extensibility:** New attack tools can be integrated by adding a new Docker image and updating the backend logic, making it easy to incorporate new research advancements.

**3.2.3. Asynchronous Workflow and Reporting**

Since ML analysis can be time-consuming, the entire process is asynchronous.
1.  **User Initiates a Test:** The user clicks a button on the frontend.
2.  **Frontend → Node.js Backend:** The frontend sends the request to the Node.js backend, which acts as the API gateway.
3.  **Task Distribution and Confirmation:** The Node.js backend immediately returns a confirmation to the frontend to keep the UI responsive and forwards the task to the Flask backend.
4.  **Flask Backend Performs Analysis:** The Flask backend handles the complex ML analysis. After completing the analysis, it stores results in a Shared Volume, a persistent storage space accessible to other services.
5.  **Frontend Polls for Data:** The frontend periodically polls the backend to check the status and retrieve results.
6.  **Result Retrieval and Report Generation:** Once the results are retrieved, the `reportGenerator.js` module dynamically creates a comprehensive HTML report with charts and visualizations for the user.

---

#### **3.3. Technology Stack**

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend (API Gateway):** Node.js, Express.js
* **Backend (Analysis Engine):** Python 3.8, Flask
* **Database:** MySQL 8.0
* **Containerization:** Docker, Docker Compose
* **Key ML/Attack Libraries:** TensorFlow Privacy, Pytorch, Privacy meter, Adversarial Robustness Toolbox (ART), etc.
* **File Handling:** Multer (for Node.js)

---

#### **3.4 Testbed User Interface Introduction**

The Robust-ML-Testbed features a user-friendly, web-based interface for assessing ML model vulnerabilities without requiring extensive technical expertise. It's deployed locally via Docker, with all services (frontend, Node.js backend, Flask analysis engine, and MySQL database) running in containers. Users can access the main page at `http://localhost:3000/`, which has buttons for "Vulnerability Assessment" and "Exploitation Assessment".

![Fig.2 The main page of the testbed](https://i.imgur.com/K3V1D8B.png)

On the **Vulnerability Assessment** page, users enter a "Project Client Name" and then select model profiles from dropdown menus, including Attack Types, Data Modality, and Tasks. Clicking the "Vulnerability Assessment" button queries the knowledge base to show potential vulnerabilities, such as privacy attacks, in a dedicated area. Users can then generate a printable report summarizing the assessment.

![Fig. 3 Vulnerability Assessment page](https://i.imgur.com/B9P1yWc.png)

On the **Exploitation Assessment** page, users select one or more attack implementations from a list (e.g., TensorFlow Privacy, ART). They upload the appropriate model file (e.g., `.h5` for TensorFlow Privacy). Clicking "Exploitation Assessment" starts the asynchronous analysis, with progress updates shown in a status area. Once completed, users can generate an Exploitation Assessment (EA) Report, which includes detailed results, metrics, and visualizations.

![Fig.4 Exploitation Assessment page](https://i.imgur.com/2s44K7t.png)

---

### **4. Testing & Results Analysis**

#### **4.1. Testing Methodology**

Following development and deployment, a comprehensive system validation was conducted to ensure reliability, functionality, and performance. The validation included a multi-faceted approach:
* **End-to-End Testing:** Simulated complete user workflows, from model/dataset upload to attack execution and report generation.
* **Integration Testing:** Verified internal communication channels between the frontend, Node.js, Flask, and the attack containers. Data integrity was also confirmed across shared volumes and the MySQL database.
* **Deployment Testing:** The application was deployed repeatedly on different environments (local Windows and an NRC Linux server) using Docker Compose to ensure reproducibility and reliability.

Additionally, a dedicated case study validated the platform's handling of privacy attacks and defenses, focusing on **membership inference attacks (MIAs)** to align with the report's emphasis on privacy vulnerabilities.

---

#### **4.2. Key Test Results**

Testing confirmed that all core functionalities of the Robust-ML-Testbed operated as designed. All 42 test cases, covering modules like File Upload, Database Query, Report Generation, and API Communication, achieved a **100% pass rate** with no failures or blocking issues. The system showed robust performance during end-to-end, integration, and deployment testing, verifying reliability in file uploads, API interactions, data storage, error management, and integrated workflows.

#### **4.3. Integrated Case Study: Robustness Assessment of Machine Learning Models under Membership Inference Attacks**

A case study was conducted to validate the testbed's effectiveness and generalizability, focusing on MIAs. This study demonstrated the platform's ability to assess two versions of a model—a base model and a differentially private (DP) variant—under the same attacks. The analysis used the **Multi-layer Perceptron (MLP) attack** from the TensorFlow Privacy MIA suite.

**4.3.1 Case Study Design**
* **Objective:** To validate the testbed and show its generalizability in a medical privacy context by consistently assessing two model versions under the same privacy attacks. The study aimed to confirm that the framework can handle multiple models and accurately capture privacy improvements.
* **Workflow:** The study followed a six-step workflow:
    * **a)** Model and dataset selection.
    * **b)** Baseline assessment on the base model.
    * **c)** Apply a defense technique, like differential privacy.
    * **d)** Reassessment by rerunning the same attacks on the DP-enhanced model.
    * **e)** Compare the pre- and post-defense results to quantify improvements.
    * **f)** Analyze the testbed's generalizability and suggest improvements.
* **Model and Dataset Rationale:** The study used a **RandomForestClassifier** for multi-class classification of patient outcomes and the **Texas-100X medical records dataset**, which includes sensitive patient information. This dataset was chosen for its complexity, with hundreds of features, class imbalance, and scale, making it ideal for evaluating privacy risks in healthcare. Using the same data and architecture ensured any difference in privacy metrics could be attributed to the DP defense.

![Fig.5 Workflow Diagram of the use case](https://i.imgur.com/vHq0F21.png)

**4.3.3. Case Study Execution**
* **Attack Focus:** The study focused exclusively on MIAs, which try to determine if a data point was in the model's training set, potentially exposing sensitive medical information. The testbed used the MLP attack from the TensorFlow Privacy suite.
* **Base Model Results:** The baseline model (test accuracy of ~0.917) showed privacy leakage. The attack achieved an **AUC of 0.626** and an attacker advantage of 0.179. Its ROC curves showed it was easier for attackers to infer membership.
* **DP-Enhanced Model Results:** After applying differential privacy (ε = 1.0), the model's test accuracy dropped to ~0.751. The DP defense mitigated privacy leakage by adding noise, and the attack's **AUC approached ~0.498**. The ROC curve comparison showed that the DP model's outputs did not allow the attacker to distinguish between training and non-training samples.

![Fig.6 ROC curves of MLP attacks on Non-DP and DP models](https://i.imgur.com/E8jP74C.png)

The following table summarizes the metrics:

| Metric | Base Model | DP-Enhanced Model |
| :--- | :--- | :--- |
| Model Accuracy | 0.917 | 0.751 |
| Attack AUC | 0.626 | 0.498 |

The testbed correctly flagged the baseline model as privacy-vulnerable and suggested applying differential privacy. When the DP-enhanced model was reassessed, its AUC scores dropped significantly, validating the testbed's recommendation while maintaining reasonable model utility (e.g., only ~16.6% accuracy loss).

**4.3.4. Case Study Analysis**
* **Generalizability of the Testbed:** The testbed successfully handled both the base and DP-enhanced models through the same workflow, showing its generality in medical privacy use cases. No special modifications were needed, and the framework automatically accounted for challenges like dataset scale and class imbalance. The architecture and taxonomy-driven attack matching make it easy to extend to other models or domains.
* **Potential Improvements:** The comparative results highlight areas for enhancement.
    1.  **More Attacks:** The testbed could include more privacy attacks (e.g., database reconstruction).
    2.  **Automated Parameter Sweeps:** Automating parameter tuning for defenses like differential privacy would provide deeper insight into the privacy-utility tradeoff.
    3.  **Richer Visualization:** The reporting and visualization could be enhanced with things like plotting ROC curves of inference attacks.
    4.  **Defense Recommendations:** The testbed could offer defense recommendations (e.g., “apply differential privacy”) when vulnerabilities are detected.

This case study confirms the framework's value and suggests paths for making it more comprehensive and generalizable.

---

### **5. Problems Encountered and Solutions**

**Cross-Platform Volume Mounting:** A major hurdle was managing file paths between the Windows development and Linux deployment environments.
* **Solution:** Docker Compose files were refactored to use named volumes, and host paths were parameterized. The application code was updated to use relative paths within the container, making the system environment-agnostic.

**Docker Networking and Service Discovery:** It was initially problematic to ensure containers could reliably communicate.
* **Solution:** A custom bridge network (`my-network-sxw`) was set up in Docker Compose, allowing containers to communicate using their service names. `depends_on` and `healthcheck` conditions were also implemented to enforce a proper startup order.

**Long-Running Asynchronous Tasks:** ML attacks can take a long time, and a simple synchronous HTTP request would time out.
* **Solution:** An asynchronous polling mechanism was implemented. The Node.js backend initiates the task and immediately responds to the client, and the frontend periodically queries an endpoint to check the status.

**Case Study Integration Challenges:** It was challenging to ensure the knowledge base could dynamically match privacy attacks and handle DP variants without additional configuration.
* **Solution:** The MySQL schema was enhanced to include DP-specific flags, and the Flask backend was updated to automatically rerun attacks on defended models for comparative reporting.

---

### **6. Conclusion and Future Work**

#### **6.1. Conclusion**

This project successfully delivered the Robust-ML-Testbed, a functional web-based platform for evaluating machine learning model robustness. It provides an accessible interface for users to upload models, configure and execute adversarial attacks, and analyze results. The multi-container microservice architecture, deployed via Docker, ensures modularity and reliable deployment. The integrated case study on membership inference attacks validates the platform's ability to quantify privacy risks and defense improvements. The platform is a valuable tool for researchers and developers to understand and improve the resilience of their ML models.

#### **6.2. Future Work**

While the current platform has core functionality, several areas could be improved:
* **Expanded Attack/Defense Library:** Integrate a wider range of attacks and add functionality to test the effectiveness of more defense mechanisms, like adversarial training.
* **Enhanced Visualization:** Implement more sophisticated and interactive visualizations for comparing results across different attacks, models, and defense configurations, such as ROC curves for MIAs.
* **Improved Asynchronous Handling:** Replace the current polling mechanism with a more efficient solution like WebSockets or a dedicated task queue (e.g., Celery) for real-time progress updates.
* **User Management:** Introduce user accounts to manage private models, datasets, and save test history.
* **Cloud Deployment:** Adapt the Docker Compose configuration for scalable deployment to cloud platforms like AWS or Google Cloud.
* **Advanced Case Study Extensions:** Automate parameter tuning for defenses like differential privacy and integrate utility-privacy trade-off analyses into standard workflows.

---

### **7. References**

* [1] C. Szegedy et al., “Intriguing properties of neural networks,” arXiv preprint arXiv:1312.6199, 2013.
* [2] I. J. Goodfellow, J. Shlens, and C. Szegedy, “Explaining and harnessing adversarial examples,” arXiv preprint arXiv:1412.6572, 2014.
* [3] A. Madry, A. Makelov, L. Schmidt, D. Tsipras, and A. Vladu, “Towards deep learning models resistant to adversarial attacks,” arXiv preprint arXiv:1706.06083, 2017.
* [4] N. Carlini and D. Wagner, “Towards evaluating the robustness of neural networks,” in Proc. IEEE Symposium on Security and Privacy (SP), 2017, pp. 39–57.
* [5] R. Shokri, M. Stronati, C. Song, and R. Shmatikov, “Membership inference attacks against machine learning models,” in Proc. IEEE Symposium on Security and Privacy (SP), 2017, pp. 4–17.
* [6] J. P. Smith, "Benefits of microservice architecture in large-scale applications," IEEE Trans. Softw. Eng., vol. 25, no. 3, pp. 201-210, Mar. 2018.
* [6] Github Repository: victorsxw/Robust-ML-Test-Bed.
* [7] "Best 10 Tools for Testing Machine Learning Algorithms" - Deepchecks (2025).
* [8] "Robustness Testing: The Essential Guide" - Nightfall AI Security 101.
* [9] "Understanding Machine Learning Robustness" – Medium.
* [10] "Model Robustness: Building Reliable AI Models" – Encord.
* [11] Web Accessibility Initiative. (2023). Web Content Accessibility Guidelines (WCAG) Overview.
* [12] Shokri, R., Stronati, M., Song, C., & Shmatikov, V. (2017). "Membership Inference Attacks Against Machine Learning Models." Proceedings of the IEEE Symposium on Security and Privacy (S&P).
* [13] Rigaki M, Garcia S. A survey of privacy attacks in machine learning[J]. ACM Computing Surveys, 2023, 56(4): 1-34.
* [14] Github Repository: privacytrustlab/ml_privacy_meter.
* [15] Github Repository: Trusted-AI/adversarial-robustness-toolbox.
