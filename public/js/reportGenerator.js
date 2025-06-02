// Report Generator
import ReportConfig from './config/reportConfig.js';
import { deepMerge, extractResultsFromJson, generateReportStyles, showNotification } from './utils/reportUtils.js';

/**
 * 获取客户信息
 * @return {Object} - 客户信息对象
 */
function getClientInfo() {
    return {
        name: localStorage.getItem('globalClientName') || 'Client',
        date: new Date().toLocaleDateString(),
        modelFile: window.modelFileName || 'No model file uploaded',
        trainingData: window.trainDatasetFileName || 'No training dataset uploaded',
        testingData: window.testDatasetFileName || 'No test dataset uploaded',
        modelArchitecture: window.modelArchitecture || localStorage.getItem('modelArchitecture') || null
    };
}

/**
 * 获取模型架构信息
 * @param {string} modelPath - 模型文件路径
 * @return {Promise<string>} - 模型架构信息
 */
async function getModelArchitecture(modelPath) {
    try {
        const response = await fetch('/api/model-architecture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelPath })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch model architecture');
        }

        const data = await response.json();
        return data.architecture;
    } catch (error) {
        console.error('Error fetching model architecture:', error);
        return null;
    }
}

/**
 * 加载所有必要的数据
 * @param {Array} implementations - 实现ID数组
 * @return {Promise} - 包含所有数据的Promise
 */
async function loadAllRequiredData(implementations) {
    const dataPromises = [];
    
    implementations.forEach(impl => {
        // Get the implementation ID from the object or use the value directly if it's a string
        const id = typeof impl === 'object' ? impl.implementation_ID : impl;
        
        // Load JSON data
        dataPromises.push(
            fetch(`${ReportConfig.paths.results}/${id}.json`)
                .then(response => {
                    if (!response.ok) {
                        console.error(`Failed to load data for ${id}: ${response.status} ${response.statusText}`);
                        throw new Error(`Failed to load data for ${id}`);
                    }
                    return response.text();  // 首先获取原始文本
                })
                .then(text => {
                    try {
                        // 尝试解析为 JSON
                        const jsonData = JSON.parse(text);
                        console.log(`Successfully loaded data for ${id}:`, jsonData);
                        return { id, dataType: 'json', content: jsonData };
                    } catch (error) {
                        console.error(`Error parsing JSON for ${id}:`, error);
                        console.log('Raw text content:', text);
                        // 如果解析失败，尝试将文本按行分割并解析每一行
                        const lines = text.split('\n').filter(line => line.trim());
                        const jsonLines = lines.map(line => {
                            try {
                                return JSON.parse(line);
                            } catch (e) {
                                return { message: line };
                            }
                        });
                        return { id, dataType: 'json', content: jsonLines };
                    }
                })
                .catch(error => {
                    console.error(`Error loading data for ${id}:`, error);
                    return { id, dataType: 'json', error };
                })
        );
        
        // Load image data
        const imagePath = `${ReportConfig.paths.results}/${id}.png`;
        console.log(`Attempting to load image from: ${imagePath}`);
        dataPromises.push(
            fetch(imagePath)
                .then(response => {
                    if (!response.ok) {
                        // Try alternative case variations
                        const lowerImagePath = `${ReportConfig.paths.results}/${id.toLowerCase()}.png`;
                        console.log(`Retrying with lowercase path: ${lowerImagePath}`);
                        return fetch(lowerImagePath);
                    }
                    return response;
                })
                .then(response => ({ 
                    id, 
                    dataType: 'image', 
                    exists: response.ok,
                    path: response.ok ? imagePath : null
                }))
                .catch(error => {
                    console.error(`Error loading image for ${id}:`, error);
                    return { id, dataType: 'image', exists: false };
                })
        );
    });
    
    const results = await Promise.all(dataPromises);
    
    const organizedData = implementations.reduce((acc, impl) => {
        const id = typeof impl === 'object' ? impl.implementation_ID : impl;
        acc[id] = { json: null, image: null };
        return acc;
    }, {});
    
    results.forEach(item => {
        if (item.dataType === 'json' && !item.error) {
            organizedData[item.id].json = item.content;
            console.log(`Organized data for ${item.id}:`, item.content);
        } else if (item.dataType === 'image' && item.exists) {
            organizedData[item.id].image = item.path;
        }
    });
    
    return organizedData;
}

/**
 * 组装报告数据
 * @param {Object} config - 配置对象
 * @param {Object} clientInfo - 客户信息
 * @param {Array} implementations - 实现ID数组
 * @param {Object} loadedData - 加载的数据
 * @return {Object} - 报告数据
 */
function assembleReportData(config, clientInfo, implementationsWithParams, loadedData) {
    const reportNumber = `${config.reportInfo.reportNumberPrefix}${Date.now().toString().slice(-6)}`;
    const implementationIds = implementationsWithParams.map(impl => impl.implementation_ID);

    // Get implementations with num_samples
    const numSamplesImpls = implementationsWithParams
        .filter(impl => impl.implementation_ID === 'ART_PA_007' && impl.num_samples)
        .map(impl => `${impl.implementation_ID}: ${impl.num_samples}`);

    // Get implementations with poison_rate
    const poisonRateImpls = implementationsWithParams
        .filter(impl => ['ART_PA_003', 'ART_PA_004', 'ART_PA_006', 'ART_PA_009'].includes(impl.implementation_ID) && impl.poison_rate)
        .map(impl => `${impl.implementation_ID}: ${impl.poison_rate}`);

    // Format the values
    const numSamplesValue = numSamplesImpls.length > 0 ? numSamplesImpls.join('<br>') : 'No need';
    const poisonRateValue = poisonRateImpls.length > 0 ? poisonRateImpls.join('<br>') : 'No need';

    const analysisResults = implementationIds.map(id => {
        const data = loadedData[id] || {};
        const results = data.json ? extractResultsFromJson(data.json, id) : {
            metrics: [],
            notes: ['No data available']
        };

        return {
            id,
            title: `(${implementationIds.indexOf(id) + 1}) ${id}`,
            imagePath: data.image,
            metrics: results.metrics,
            notes: results.notes
        };
    });

    // Process strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    analysisResults.forEach(result => {
        if (result.metrics && result.metrics.length) {
            result.metrics.forEach(metric => {
                const value = parseFloat(metric.value);
                
                if (metric.name.includes('Accuracy') && value > 70) {
                    strengths.push(`Strong ${metric.name.toLowerCase()} performance (${metric.value})`);
                } else if (metric.name.includes('Accuracy') && value < 50) {
                    weaknesses.push(`Poor ${metric.name.toLowerCase()} performance (${metric.value})`);
                }
                
                if (metric.name.includes('Evasion') && value < 15) {
                    strengths.push(`Good resistance to evasion attacks (${metric.value})`);
                } else if (metric.name.includes('Evasion') && value > 30) {
                    weaknesses.push(`Vulnerable to evasion attacks (${metric.value})`);
                }
            });
        }
    });
    
    if (strengths.length === 0) strengths.push('No significant strengths identified');
    if (weaknesses.length === 0) weaknesses.push('No significant weaknesses identified');

    // Keep client info structure simple but include the parameter values
    const clientData = {
        ...clientInfo,
        numSamplesValue,
        poisonRateValue
    };

    return {
        reportNumber,
        client: clientData,
        implementationIds,
        implementationsWithParams,
        assessmentRecords: document.getElementById('pythonResult')?.value || '',
        analysisResults,
        conclusions: {
            strengths,
            weaknesses,
            summary: `This evaluation analyzed the model's security performance across ${implementationIds.length} implementation(s). The model shows ${strengths.length} strength(s) and ${weaknesses.length} weakness(es).`
        },
        // Add tools data from config
        tools: config.staticContent.robustnessAssessment.assessmentTools || []
    };
}

/**
 * 生成评估指标表格的HTML
 * @param {Array} metrics - 评估指标数组
 * @return {string} - 表格HTML
 */
function generateMetricsTable(metrics) {
    if (!metrics || !metrics.length) {
        return '<p>No metrics available</p>';
    }

    return `
        <table class="report-table metrics-table">
            <thead>
                <tr>
                    <th>Metric Type</th>
                    <th>Metrics</th>
                </tr>
            </thead>
            <tbody>
                ${metrics.map(category => `
                    <tr>
                        <td>${category.type}</td>
                        <td>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${category.metrics.map(metric => `
                                    <li>${metric}</li>
                                `).join('')}
                            </ul>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * 生成报告HTML
 * @param {Object} config - 配置对象
 * @param {Object} data - 报告数据
 * @return {string} - HTML字符串
 */
function generateReportHtml(config, data) {
    const styles = generateReportStyles(config.styles);
    
    const contentHtml = `
        <div class="ea-report">
            <!-- 报告封面 -->
            <div class="report-cover">
                <div class="cover-corner">1</div>
                <div class="cover-main">
                    <img src="${config.reportInfo.logo}" alt="Logo" class="cover-logo">
                    <h1 class="cover-title">${config.reportInfo.title}</h1>
                    <div class="cover-info">
                        <p><span>Prepared for:</span> ${data.client.name || '[Client/Organization Name]'}</p>
                        <p><span>Prepared by:</span> ${config.reportInfo.preparedBy || 'Robust ML Team'}</p>
                        <p><span>Date:</span> ${data.client.date || '[MM/DD/YYYY]'}</p>
                    </div>
                </div>
                <div class="cover-footer-banner">
                    <span class="banner-left">EA REPORT</span>
                   
                </div>
            </div>
            
       
            <!-- 目录页 -->
            <div class="toc-page">
                <div class="report-toc">
                    <div class="cover-corner">2</div>
                    <h2>Contents</h2>
                    <ol>
                        <li><span class="toc-number">1</span>${config.sectionTitles.purpose.substring(3)}</li>
                        <li><span class="toc-number">2</span>${config.sectionTitles.clientProfiles.substring(3)}</li>
                        <li><span class="toc-number">3</span>${config.sectionTitles.robustnessAssessment.substring(3)}</li>
                        <li><span class="toc-number">4</span>${config.sectionTitles.results.substring(3)}</li>
                        ${config.sectionTitles.conclusions ? `<li><span class="toc-number">5</span>${config.sectionTitles.conclusions.substring(3)}</li>` : ''}
                    </ol>
                </div>
            </div>

            <!-- 内容部分 -->
            <div class="content-page">
                <div class="report-content">
                    <!-- 1. 目的 -->
                    <div class="report-section">
                        <h2>${config.sectionTitles.purpose}</h2>
                        <p>${config.staticContent.purpose}</p>
                    </div>
                    
                    <!-- 2. 客户概况 -->
                    <div class="report-section">
                        <h2>${config.sectionTitles.clientProfiles}</h2>
                        <p>${config.staticContent.clientProfilesIntro}</p>
                        <table class="report-table client-profile-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Items</th>
                                    <th>Name/Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>Client ID</td>
                                    <td>${data.client.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td>Uploaded Model</td>
                                    <td>${data.client.modelFile || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>3</td>
                                    <td>Training Dataset</td>
                                    <td>${data.client.trainingData || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>4</td>
                                    <td>Testing Dataset</td>
                                    <td>${data.client.testingData || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>5</td>
                                    <td>Number of Samples<br><small>(Need for ART_PA_007)</small></td>
                                    <td>${data.client.numSamplesValue}</td>
                                </tr>
                                <tr>
                                    <td>6</td>
                                    <td>Poison Rate<br><small>(Need for ART_PA_003/004/006/009)</small></td>
                                    <td>${data.client.poisonRateValue}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 3. Robustness Assessment -->
                    <div class="report-section">
                        <h2>${config.sectionTitles.robustnessAssessment}</h2>

                        <h3>3.1 Overview</h3>
                        <p>${config.staticContent.robustnessAssessment.overview}</p>

                        <h3>3.2 Knowledge Base</h3>
                        <p>${config.staticContent.robustnessAssessment.knowledgeBase}</p>

                        <h3>3.3 Assessment Framework</h3>
                        <p>${config.staticContent.robustnessAssessment.assessmentFramework}</p>
                        
                        <!-- Add architecture diagram -->
                        <div class="architecture-diagram">
                            <img src="${config.images.architectureDiagram}" alt="Assessment Framework Architecture" style="max-width: 100%; height: auto; margin: 20px 0;">
                        </div>

                        <h3>3.4 Assessment Tools</h3>
                        <p>${config.staticContent.robustnessAssessment.assessmentToolsIntro}</p>
                        <table class="report-table assessment-tools-table">
                            <thead>
                                <tr>
                                    <th>Tool Name</th>
                                    <th>Description</th>
                                    <th>Developer</th>
                                    <th>Activity Status</th>
                                    <th>Attack Methods</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${config.staticContent.robustnessAssessment.assessmentTools.map(tool => `
                                    <tr>
                                        <td>${tool.name}</td>
                                        <td>${tool.description}</td>
                                        <td>${tool.developer}</td>
                                        <td>${tool.activity}</td>
                                        <td>${tool.attackMethods}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <h3>3.5 Evaluation Metrics</h3>
                        <p>${config.staticContent.robustnessAssessment.evaluationMetricsIntro}</p>
                        ${generateMetricsTable(config.staticContent.evaluationMetrics)}
                    </div>
                    
                    <!-- 4. 评估结果 -->
                    <div class="report-section">
                        <h2>${config.sectionTitles.results}</h2>
                        
                        <h3>4.1 Assessment Process Records</h3>
                        <p>We selected the following Implementation_ID to assess the model's risk:</p>
                        <ul>
                            ${data.implementationIds.map(id => `<li>${id}</li>`).join('')}
                        </ul>
                        
                        <div class="process-records">
                            <pre>${data.assessmentRecords}</pre>
                        </div>
                        
                        <h3>4.2 Analysis Result</h3>
                        <p>The analysis results are listed as follows.</p>
                        
                        ${data.analysisResults.map((result, index) => `
                            <div class="analysis-result">
                                <h4>(${index + 1}) ${result.id}</h4>
                                
                                <!-- 结果图表 -->
                                <div class="result-diagram">
                                    <h5>Results Diagram (${result.id}.png)</h5>
                                    ${result.imagePath 
                                        ? `<img src="${result.imagePath}" alt="Results for ${result.id}" class="result-image">`
                                        : `<div class="no-image">No image available for ${result.id}</div>`
                                    }
                                </div>
                                
                                <!-- 结果数据 -->
                                <div class="metrics-summary">
                                    <h5>Results Data (${result.id}.json)</h5>
                                    ${result.id.startsWith('Tensorflow_privacy_') && result.notes && result.notes.length > 0 ? `
                                        <div class="result-data-block" style="font-family: monospace; white-space: pre-wrap; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #eee; border-radius: 4px; text-align: left !important;">
                                            ${result.notes[0].replace('Attack type with max AUC:', '<strong>Attack type with max AUC:</strong>')}
                                        </div>
                                    ` : ''}
                                    ${result.id.startsWith('Privacy_meter_') && result.notes && result.notes.length > 0 ? `
                                        <div style="font-family: monospace; white-space: pre-wrap; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #eee; border-radius: 4px; max-height: 400px; overflow-y: auto;">
                                            ${result.notes[0].split(',\n').map(line => 
                                                `<div style="padding: 2px 0;">${line}</div>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                    ${result.id.startsWith('ART_EA_') && result.notes && result.notes.length > 0 ? `
                                        <div style="font-family: monospace; white-space: pre-wrap; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #eee; border-radius: 4px;">
                                            ${result.notes[0].split('\n').map(line => 
                                                `<div style="padding: 2px 0;">${line}</div>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                    ${result.id.startsWith('ART_PA_') && result.notes && result.notes.length > 0 ? `
                                        <div style="font-family: monospace; white-space: pre-wrap; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #eee; border-radius: 4px;">
                                            ${result.notes[0].split('\n').map(line => 
                                                `<div style="padding: 4px 0;">${line}</div>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                  </div>
                              </div>
                        `).join('')}
                        
                        <h3>4.3 FINDINGS & EXPLOITS</h3>
                        <p>Based on the analysis results, the following key findings and exploits are identified:</p>
 
                        <table class="report-table privacy-attack-table" style="margin-top: 20px;">
                            <thead>
                                <tr>
                                    <th style="text-align: center;">Implementation_ID</th>
                                    <th style="text-align: center;">Privacy Attack Type</th>
                                    <th>Defense Suggestions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td rowspan="1" style="text-align: center; white-space: nowrap;">
                                        Tensorflow_privacy_MIM_001<br>
                                        Tensorflow_privacy_MIM_002<br>
                                        Tensorflow_privacy_MIM_003<br>
                                        Tensorflow_privacy_MIM_004<br>
                                        Tensorflow_privacy_MIM_005<br>
                                        Tensorflow_privacy_MIM_006<br>
                                        Privacy_meter_MIM_001<br>
                                        Privacy_meter_MIM_002<br>
                                        Privacy360_MIM_001
                                    </td>
                                    <td rowspan="1" style="text-align: center; vertical-align: middle;">
                                        Membership Inference<br>Attacks (MIAs)
                                    </td>
                                    <td>
                                        <div style="margin-bottom: 20px;">
                                            <strong>Model-level defences:</strong>
                                            <ul>
                                                <li>Implement Differential Privacy during training</li>
                                                <li>Apply knowledge distillation techniques</li>
                                                <li>Employ output obfuscation methods</li>
                                            </ul>
                                        </div>

                                        <div style="margin-bottom: 20px;">
                                            <strong>System-level controls:</strong>
                                            <ul>
                                                <li>Establish robust access controls</li>
                                                <li>Monitor query patterns</li>
                                            </ul>
                                        </div>

                                        <div style="margin-bottom: 20px;">
                                            <strong>Core principles:</strong>
                                            <ul>
                                                <li>Limit model memorization of training data</li>
                                                <li>Control information leakage in outputs</li>
                                            </ul>
                                        </div>

                                        <p style="margin-top: 10px;">
                                            Effective protection requires combining these approaches while maintaining model utility.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center;">Privacy360_DR_001</td>
                                    <td style="text-align: center; vertical-align: middle;">Reconstruction<br>Attacks (RAs)</td>
                                    <td>
                                        <strong>Most effective defenses:</strong>
                                        <ul>
                                            <li>Differential privacy implementations</li>
                                            <li>Knowledge distillation techniques</li>
                                            <li>Output limitation strategies</li>
                                            <li>Memorization mitigation methods</li>
                                        </ul>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        These techniques directly weaken connections between model parameters and training examples, preventing precise data reconstruction. While HE and TEE secure computation, they offer minimal protection once outputs are accessible. Effective defense requires fundamentally changing how models learn and represent information, not just securing infrastructure.
                                        </p>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        The optimal approach combines statistical privacy guarantees with architectural designs that inherently resist memorization, alongside monitoring systems to detect potential reconstruction attempts.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center; white-space: nowrap;">
                                        ART_PA_G_001<br>
                                        ART_PA_002<br>
                                        ART_PA_003<br>
                                        ART_PA_004<br>
                                        ART_PA_005<br>
                                        ART_PA_006<br>
                                        ART_PA_007<br>
                                        ART_PA_008<br>
                                        ART_PA_009<br>

                                    </td>
                                    <td style="text-align: center; vertical-align: middle;">
                                        Poisoning and<br>Backdoor Attacks<br>(PA/BA)
                                    </td>
                                    <td>
                                        <strong>Against poisoning and backdoor attacks, prioritize:</strong>
                                        <ul>
                                            <li>Data sanitization techniques</li>
                                            <li>Robust training methodologies</li>
                                            <li>Model inspection approaches</li>
                                            <li>Deployment-time defenses</li>
                                        </ul>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        These methods specifically target the integrity of training data and model behavior. 
                                        While secure aggregation in federated learning and cryptographic verification provide some protection, 
                                        they don't entirely prevent sophisticated poisoning or backdoor insertion.
                                        </p>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        Comprehensive protection requires combining pre-training data validation, 
                                        training-time robustness mechanisms, and post-training model analysis.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center; white-space: nowrap;">
                                        ART_EA_WB_001,<br>
                                        ART_EA_WB_002,<br>
                                        ART_EA_WB_003,<br>
                                        ART_EA_WB_004,<br>
                                        ART_EA_WB_005,<br>
                                        ART_EA_BB_001,<br>
                                        ART_EA_BB_002,<br>
                                        ART_EA_BB_003,<br>
                                        ART_EA_BB_004,<br>
                                        ART_EA_BB_005,<br>
                                        ART_EA_U_001
                                    </td>
                                    <td style="text-align: center; vertical-align: middle;">
                                        Evasion Attacks<br>(EA)
                                    </td>
                                    <td>
                                        <strong>Against evasion attacks, prioritize:</strong>
                                        <ul>
                                            <li>Adversarial training</li>
                                            <li>Input preprocessing techniques</li>
                                            <li>Model regularization methods</li>
                                            <li>Runtime detection systems</li>
                                        </ul>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        These approaches specifically counter the manipulation of model inputs at inference time. While 
                                        model obfuscation and secure inference environments protect the model itself, they don't 
                                        fundamentally address the vulnerability to adversarial examples.
                                        </p>
                                        <p style="margin: 10px 0; line-height: 1.6;">
                                        Effective protection requires combining model hardening through adversarial examples exposure during 
                                        training with multi-layered detection and preprocessing at inference time.
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    

                    
                    <!-- 页脚 -->
                    <div class="report-footer">
                        <p>${config.reportInfo.footerText}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.reportInfo.title} - ${data.reportNumber}</title>
            <meta charset="UTF-8">
            <style>
                ${styles}
                
                /* 新增封面样式 */
                .report-cover {
                    min-height: 100vh; /* Changed from 100vh for better print layout */
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 0; /* Remove padding */
                    text-align: center;
                    page-break-after: always;
                    background-color: #f0f0f0; /* Light grey background */
                    position: relative; /* Needed for corner element */
                    font-family: ${config.styles.fontFamily || 'Arial, sans-serif'};
                    /* Add subtle background pattern if possible/desired */
                    /* background-image: url('path/to/pattern.png'); */
                }

                .cover-corner {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 0;
                    height: 0;
                    border-style: solid;
                    border-width: 0 80px 80px 0; /* Adjust size as needed */
                    border-color: transparent #3a5f8a transparent transparent; /* Dark blue corner */
                    line-height: 80px; /* Match border height */
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center; /* Center the number within the triangle */
                    /* Adjust the number positioning within the triangle */
                    padding: 5px 0 0 25px; /* Fine-tune padding */
                    box-sizing: border-box;
                }


                .cover-main {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    position: relative;
                }

                .cover-logo {
                    max-width: 150px;
                    margin-bottom: 30px;
                    opacity: 0.2;
                    position: absolute;
                    top: 80px;
                }

                .cover-title {
                    font-size: 32px;
                    margin: 0;
                    color: #333;
                    font-weight: bold;
                    position: absolute;
                    top: 45%;
                    transform: translateY(-50%);
                }

                .cover-info {
                    text-align: left;
                    color: #333;
                    font-size: 14px;
                    width: 80%;
                    max-width: 600px;
                    align-self: center;
                    position: absolute;
                    bottom: 120px;
                }

                .cover-info p {
                    margin: 8px 0;
                }
                 .cover-info span {
                    display: inline-block;
                    width: 100px; /* Fixed width for labels */
                    font-weight: bold;
                    margin-right: 10px;
                 }


                .cover-footer-banner {
                    background-color: #466a9c; /* Blue banner color */
                    color: white;
                    padding: 10px 40px; /* Padding inside banner */
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    font-weight: bold;
                    width: 100%; /* Make banner full width */
                    box-sizing: border-box; /* Include padding in width */
                    position: absolute; /* Position at the bottom */
                    bottom: 0;
                    left: 0;
                }

                .banner-left {
                    text-align: left;
                }

                .banner-right {
                    text-align: right;
                }

                /* 目录样式 */
                .report-toc {
                    min-height: 100vh;
                    padding: 60px 40px 40px 60px; /* Adjust padding */
                    page-break-after: always;
                    position: relative; /* For corner element */
                    background-color: white; /* Ensure white background */
                }

                /* Reuse cover corner style, adjust content/color if needed */
                .report-toc .cover-corner {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 0;
                    height: 0;
                    border-style: solid;
                    border-width: 0 80px 80px 0;
                    border-color: transparent #3a5f8a transparent transparent;
                    line-height: 80px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    padding: 5px 0 0 25px;
                    box-sizing: border-box;
                    /* content: '2'; /* Page number */
                }

                .report-toc h2 {
                    text-align: left; /* Align left */
                    margin-bottom: 40px;
                    /* color: ${config.styles.primaryColor}; */
                    color: #000; /* Black color for Contents */
                    font-size: 24px; /* Adjust font size */
                    font-weight: bold;
                }

                .report-toc ol {
                    list-style-type: none;
                    padding: 0;
                    margin: 0; /* Remove auto margin */
                    max-width: none; /* Remove max width */
                }

                .report-toc li {
                    margin: 15px 0; /* Adjust spacing */
                    font-size: 16px; /* Adjust font size */
                    color: #0056b3; /* Blue color for items */
                    font-weight: normal; /* Normal weight */
                }

                 .report-toc li span.toc-number {
                    display: inline-block;
                    width: 20px; /* Adjust width for number */
                    margin-right: 15px; /* Space between number and text */
                    font-weight: normal;
                 }

                @media print {
                    .report-cover {
                        min-height: 100vh;
                        page-break-after: always;
                    }
                    
                    .report-toc {
                        min-height: 100vh;
                        page-break-after: always;
                    }
                }

                /* 新增模型架构信息样式 */
                .model-info {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                }

                .model-architecture {
                    overflow-x: auto;
                    margin: 10px 0;
                }

                .architecture-text {
                    font-family: monospace;
                    white-space: pre;
                    margin: 0;
                    padding: 10px;
                    background-color: #fff;
                    border: 1px solid #eee;
                    border-radius: 4px;
                }

                /* 确保模型信息在打印时正确显示 */
                @media print {
                    .model-info {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    
                    .model-architecture {
                        overflow-x: visible;
                    }
                }

                .ea-report {
                    max-width: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                }

                .report-cover {
                    height: 100vh;
                    page-break-after: always;
                }

                .report-toc {
                    padding: 40px 20px 20px 40px;
                    position: relative;
                    background-color: white;
                    height: auto;
                    min-height: 0;
                }

                .report-content {
                    padding: 20px;
                    background-color: white;
                }

                .report-section {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    margin-top: 20px;
                }

                .report-section:first-child {
                    margin-top: 0;
                }

                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }

                    .ea-report {
                        width: 100%;
                        max-width: none;
                        margin: 0;
                        padding: 0;
                    }

                    .report-cover {
                        height: 100vh;
                        page-break-after: always;
                    }

                    .report-toc {
                        height: auto;
                        min-height: 0;
                        page-break-after: auto;
                        padding: 40px 20px 20px 40px;
                    }

                    .report-content {
                        page-break-before: auto;
                        padding: 20px;
                    }

                    .report-section {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }

                /* 样式部分修改 */
                .toc-page {
                    min-height: 100vh;
                    page-break-after: always;
                    background-color: white;
                }

                .report-toc {
                    padding: 60px 40px 40px 60px;
                    position: relative;
                }

                .content-page {
                    background-color: white;
                    page-break-before: auto;
                    page-break-after: auto;
                }

                .report-content {
                    padding: 40px;
                }

                @media print {
                    .toc-page {
                        height: 100vh;
                        page-break-after: always;
                        page-break-before: always;
                    }

                    .content-page {
                        page-break-before: auto;
                    }

                    .report-section {
                        page-break-inside: avoid;
                    }

                    .report-section:first-child {
                        margin-top: 0;
                    }
                }

                .privacy-attack-table {
                    margin: 20px 0;
                    border-collapse: collapse;
                    width: 100%;
                }
                
                .privacy-attack-table th {
                    background-color: #f0f2f5;
                    padding: 12px;
                    border: 1px solid #ddd;
                    font-weight: 600;
                }
                
                .privacy-attack-table td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    vertical-align: top;
                    line-height: 1.6;
                }

                .privacy-attack-table td[rowspan] {
                    background-color: #f8f9fa;
                }
                
                .privacy-attack-table ul {
                    margin: 5px 0;
                    padding-left: 20px;
                }
                
                .privacy-attack-table li {
                    margin: 5px 0;
                }
                
                .privacy-attack-table strong {
                    color: #2c3e50;
                    display: block;
                    margin-bottom: 8px;
                }

                @media print {
                    .privacy-attack-table {
                        page-break-inside: avoid;
                    }
                    .privacy-attack-table td,
                    .privacy-attack-table th {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `;
}

/**
 * 在新窗口中打开报告
 * @param {string} html - 报告HTML
 */
function openReportInNewWindow(html) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = function() {
        const printButton = printWindow.document.createElement('button');
        printButton.innerText = 'Print Report';
        printButton.style.position = 'fixed';
        printButton.style.top = '10px';
        printButton.style.right = '10px';
        printButton.style.padding = '10px 20px';
        printButton.style.backgroundColor = ReportConfig.styles.primaryColor;
        printButton.style.color = 'white';
        printButton.style.border = 'none';
        printButton.style.borderRadius = '4px';
        printButton.style.cursor = 'pointer';
        printButton.style.zIndex = '9999';
        
        printButton.addEventListener('click', () => {
            printButton.style.display = 'none';
            printWindow.print();
            setTimeout(() => {
                printButton.style.display = 'block';
            }, 500);
        });
        
        printWindow.document.body.appendChild(printButton);
    };
}

/**
 * 生成完整的评估报告
 * @param {Object} customConfig - 可选的自定义配置，用于覆盖默认配置
 */
export async function generateComprehensiveReport(customConfig = {}) {
    console.log('Starting comprehensive report generation...');
    
    const config = deepMerge(ReportConfig, customConfig);
    const clientInfo = getClientInfo();
    
    const selectedImplementations = getSelectedImplementations();
    if (!selectedImplementations || selectedImplementations.length === 0) {
        showNotification('Please select at least one implementation before generating the report', 'error');
        return;
    }
    
    try {
        // 获取模型架构信息
        if (window.modelFilePath) {
            const architecture = await getModelArchitecture(window.modelFilePath);
            if (architecture) {
                window.modelArchitecture = architecture;
                localStorage.setItem('modelArchitecture', architecture);
                clientInfo.modelArchitecture = architecture;
            }
        }

        const data = await loadAllRequiredData(selectedImplementations);
        const reportData = assembleReportData(config, clientInfo, selectedImplementations, data);
        const reportHtml = generateReportHtml(config, reportData);
        openReportInNewWindow(reportHtml);
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report: ' + error.message, 'error');
    }
}

// 导出函数
window.generateComprehensiveReport = generateComprehensiveReport; 