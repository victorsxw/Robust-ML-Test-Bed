# Test Documentation: Robust-ML-Test-Bed

**Version:** 1.0
**Date:** 2024-05-27

This document details the testing strategy, plan, and results for the Robust-ML-Test-Bed project.

## 1. Test Plan

### 1.1. Introduction & Goals

The primary goals of testing are:
*   Verify the core functionalities of the testbed (file upload, attack configuration, execution, results display, report generation).
*   Ensure the integration between different components (Frontend, Node.js Backend, Flask Backend, MySQL, Docker Volumes) works correctly.
*   Validate the basic robustness and error handling of the system.
*   Confirm the system can be successfully deployed and run using the provided Docker configuration.

### 1.2. Scope

**In Scope:**
*   Frontend user interface interactions for core workflows.
*   API endpoints provided by Node.js and Flask backends.
*   File upload mechanism and storage (including naming convention validation).
*   Basic execution flow of ML attack simulations initiated from the UI.
*   Data persistence in MySQL database (metadata, configurations, results snippets).
*   Result file generation and storage in Docker volumes (`attack_results/`).
*   Report generation feature.
*   Docker container setup and inter-service communication via `docker-compose`.
*   Basic error handling for invalid inputs or common failure scenarios.

**Out of Scope:**
*   Exhaustive testing of all possible attack algorithms and parameter combinations.
*   Detailed performance, load, or stress testing.
*   Comprehensive security vulnerability testing (penetration testing, etc.).
*   Usability testing across a wide range of users.
*   Testing compatibility with specific older browser versions (unless specified).
*   In-depth validation of the mathematical correctness of the underlying ML algorithms (assumed to be correct from the libraries used).

### 1.3. Test Environment

*   **Operating System:** (e.g., Windows 10/11, Ubuntu 22.04, macOS Sonoma) - *Specify the primary OS used for testing.*
*   **Browser:** (e.g., Chrome Latest, Firefox Latest) - *Specify browsers used.*
*   **Docker:** Docker Desktop version (e.g., 4.x) or Docker Engine version.
*   **Docker Compose:** Version included with Docker installation.
*   **Key Software Versions:**
    *   Node.js: (Specify version from `Dockerfile.web` or `package.json`)
    *   Python: (Specify version from `Dockerfile.python`)
    *   MySQL: 8.0 (as per `docker-compose.yml`)
    *   Flask: (Specify version from `flask_backend` requirements)
    *   TensorFlow / TensorFlow Privacy: (Specify version from `flask_backend` requirements)

### 1.4. Test Approach

*   **Manual System Testing:** End-to-end testing following typical user workflows via the web interface.
*   **Integration Testing:** Verifying interactions between services (Frontend <-> Node.js, Node.js <-> Flask, Backends <-> DB, Backends <-> Shared Volume). This might involve checking API responses using tools like Postman or browser developer tools, and inspecting database/volume content.
*   **Deployment Testing:** Ensuring the `docker-compose up --build` command successfully builds images and starts all containers without errors, and the application is accessible.
*   **(Optional) Unit Testing:** If unit tests exist (e.g., for specific functions in backend code), describe how they are run and summarized.

### 1.5. Test Cases

*(Add specific test cases based on the project's features. Below are examples.)*

| Test Case ID | Category         | Description                                                                 | Steps                                                                                                                               | Expected Result                                                                                                                               |
|--------------|------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| TC-FUNC-001  | File Upload      | Upload a valid ML model file.                                               | 1. Navigate to upload section. 2. Select a valid model file (e.g., `.h5`, `.pt`). 3. Submit.                                         | File uploads successfully. Confirmation message shown. File appears in `user_models/` volume with correct naming convention (`user_model_ts_orig`). |
| TC-FUNC-002  | File Upload      | Upload a valid training dataset file.                                       | 1. Navigate to upload section. 2. Select a valid dataset file (e.g., `.csv`, `.npz`). 3. Submit.                                  | File uploads successfully. Confirmation message shown. File appears in `train_dataset/` volume with correct naming convention.                |
| TC-FUNC-003  | File Upload      | Upload a valid test dataset file.                                           | 1. Navigate to upload section. 2. Select a valid dataset file. 3. Submit.                                                             | File uploads successfully. Confirmation message shown. File appears in `test_dataset/` volume with correct naming convention.                 |
| TC-FUNC-004  | File Upload      | Attempt to upload an invalid file type for a model.                         | 1. Navigate to model upload. 2. Select an invalid file (e.g., `.txt`, `.jpg`). 3. Submit.                                          | Upload fails. Clear error message shown to the user. File is not saved.                                                                       |
| TC-FUNC-005  | Attack Config    | Configure a basic attack simulation.                                        | 1. Select uploaded model. 2. Select uploaded datasets. 3. Choose an attack type. 4. Set basic parameters. 5. Submit attack request. | Request submitted successfully. Confirmation shown. Job status potentially updated in UI or DB.                                               |
| TC-FUNC-006  | Attack Execution | Monitor execution of a short attack simulation.                             | 1. Initiate an attack (TC-FUNC-005). 2. Observe UI for status updates or check backend logs/DB for progress.                      | Attack completes successfully within expected time. Status updates reflect progress (e.g., Running, Completed).                               |
| TC-FUNC-007  | Results Display  | View results of a completed attack.                                         | 1. Navigate to results section after attack completion. 2. Select the completed job.                                                 | Results (e.g., accuracy drop, metrics, sample adversarial examples) are displayed correctly. Relevant files are accessible if applicable.    |
| TC-FUNC-008  | Report Gen       | Generate a report for a completed test.                                     | 1. Select a completed test run. 2. Click 'Generate Report'.                                                                           | Report is generated (e.g., downloadable PDF/HTML). Report contains relevant information (config, results summary).                            |
| TC-INT-001   | Integration    | Node.js successfully calls Flask for processing.                            | 1. Initiate an attack (TC-FUNC-005). 2. Monitor network traffic (DevTools) or logs of Node.js and Flask services.                  | Node.js sends request to Flask API. Flask receives request and starts processing (check Flask logs).                                        |
| TC-INT-002   | Integration    | Backend services interact with MySQL DB.                                      | 1. Perform actions like upload, attack run. 2. Connect to MySQL container (`docker exec -it <mysql_container_id> mysql -u root -p`) and query relevant tables. | Metadata, configuration, status, and results are correctly inserted/updated in the database tables.                                           |
| TC-INT-003   | Integration    | Backend services read/write to shared volumes.                            | 1. Perform file upload (TC-FUNC-001/2/3). 2. Run attack (TC-FUNC-006). 3. Inspect mounted volume directories on the host machine or via `docker exec`. | Uploaded files appear in `user_models/`, `train_dataset/`, `test_dataset/`. Result files appear in `attack_results/`.                           |
| TC-DEPLOY-001| Deployment     | Build and start the application using Docker Compose.                       | 1. Navigate to project root in terminal. 2. Run `docker-compose down -v` (to clean slate). 3. Run `docker-compose up --build`.   | All images build successfully. All containers start without errors. Application is accessible via browser at the specified port (e.g., 8080). |
| TC-ERR-001   | Error Handling | Submit attack config with missing required fields.                          | 1. Go to attack config page. 2. Leave a required field blank (e.g., model). 3. Submit.                                              | Form validation prevents submission. Clear error message indicating the missing field is shown.                                               |
| TC-ERR-002   | Error Handling | Simulate Flask backend failure during processing.                         | 1. (Requires modification or specific setup) Cause Flask endpoint to return an error or timeout. 2. Initiate attack from UI.         | Frontend shows an appropriate error message indicating the task failed. Node.js logs the error from Flask. System remains stable.           |

--- 

## 2. Test Results

*(Use the table below to record the outcome of each executed test case.)*

| Test Case ID | Status (Pass/Fail) | Actual Result & Notes                                                                                                | Evidence (Link to Screenshot/Log/Bug ID) |
|--------------|--------------------|----------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| TC-FUNC-001  | Pass               | File uploaded successfully, message shown, file present in `user_models/` with correct name `user_model_168518..._mymodel.h5`. | [Screenshot_TC-FUNC-001.png]             |
| TC-FUNC-002  | Pass               |                                                                                                                      |                                          |
| TC-FUNC-003  | Pass               |                                                                                                                      |                                          |
| TC-FUNC-004  | Pass               | Upload rejected, error "Invalid file type" displayed.                                                              | [Screenshot_TC-FUNC-004.png]             |
| TC-FUNC-005  | Pass               |                                                                                                                      |                                          |
| TC-FUNC-006  | Pass               | Attack completed in ~2 minutes. UI showed "Completed".                                                               |                                          |
| TC-FUNC-007  | Pass               | Accuracy drop from 95% to 60% shown.                                                                                 | [Screenshot_TC-FUNC-007.png]             |
| TC-FUNC-008  | Pass               | PDF report generated and downloaded. Contains setup and summary results.                                             | [Report_TC-FUNC-008.pdf]                 |
| TC-INT-001   | Pass               | Flask logs show receiving request `/process` from Node.js service IP.                                                | [LogExcerpt_TC-INT-001.txt]              |
| TC-INT-002   | Pass               | Queried `attack_runs` table, verified new row inserted with correct config and status 'Completed'.                   |                                          |
| TC-INT-003   | Pass               | Inspected volumes, files present with correct names. `attack_results/` contains output logs.                           |                                          |
| TC-DEPLOY-001| Pass               | `docker-compose up --build` completed successfully. App accessible at `http://localhost:8080`.                    |                                          |
| TC-ERR-001   | Pass               | Red validation message appeared below model selection dropdown.                                                      | [Screenshot_TC-ERR-001.png]              |
| TC-ERR-002   | Fail               | Flask container stopped unexpectedly. UI showed generic "Request failed" error. Node.js logged connection refused. | [Bug-101], [NodeLog_TC-ERR-002.txt]      |
| ...          | ...                | ...                                                                                                                  | ...                                      |

### 2.1. Summary

*   **Total Test Cases Executed:** XX
*   **Passed:** XX
*   **Failed:** XX
*   **Key Findings/Observations:**
    *   (e.g., Core functionality works as expected.)
    *   (e.g., Report generation is basic, could include more details.)
    *   (e.g., Error handling for backend failures needs improvement in the frontend display - Bug-101.)
*   **Blocking Issues:** (List any critical bugs preventing further testing or release)

*(End of Document)* 