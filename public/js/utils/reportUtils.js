// Report Generator Utilities

/**
 * 深度合并两个对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @return {Object} - 合并后的对象
 */
export function deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

/**
 * 检查值是否为对象
 * @param {*} item - 要检查的值
 * @return {boolean} - 是否为对象
 */
export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * 从JSON数据中提取结果信息
 * @param {Object} jsonData - JSON数据
 * @param {string} implementationId - 实现ID
 * @return {Object} - 提取的结果
 */
export function extractResultsFromJson(jsonData, implementationId) {
    console.log(`Extracting results for ${implementationId}:`, jsonData);
    
    const metrics = [];
    const notes = [];
    
    // 特殊处理 ART_PA_ 开头的实现
    if (implementationId && implementationId.startsWith('ART_PA_')) {
        console.log('Processing ART PA implementation');
        
        if (Array.isArray(jsonData)) {
            // 特殊处理 ART_PA_009
            if (implementationId === 'ART_PA_009') {
                const accuracyResults = jsonData
                    .filter(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        return message && (
                            message.includes('model accuracy on train set') ||
                            message.includes('model accuracy on test set')
                        );
                    })
                    .map(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        // 移除时间戳和日志级别信息
                        return message.replace(/^.*?"message": "/, '').replace(/".*$/, '');
                    });
                
                if (accuracyResults.length > 0) {
                    const formattedResults = accuracyResults.join('\n');
                    notes.push(formattedResults);
                    metrics.push({
                        name: 'Accuracy Results',
                        value: formattedResults
                    });
                    return { metrics, notes };
                }
            }
            // 特殊处理 ART_PA_007
            else if (implementationId === 'ART_PA_007') {
                const results = jsonData
                    .filter(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        return message && (
                            message.includes('Clean data accuracy') ||
                            message.includes('Attack success (true/false)')
                        );
                    })
                    .map(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        // 移除时间戳和日志级别信息
                        return message.replace(/^.*?"message": "/, '').replace(/".*$/, '');
                    });
                
                if (results.length > 0) {
                    const formattedResults = results.join('\n');
                    notes.push(formattedResults);
                    metrics.push({
                        name: 'Attack Results',
                        value: formattedResults
                    });
                    return { metrics, notes };
                }
            }
            // 处理其他 ART_PA_ 实现
            else {
                const accuracyResults = jsonData
                    .filter(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        return message && (
                            message.includes('Clean data accuracy') ||
                            message.includes('Attack success rate')
                        );
                    })
                    .map(entry => {
                        const message = typeof entry === 'string' ? entry : entry.message;
                        // 移除时间戳和日志级别信息
                        return message.replace(/^.*?"message": "/, '').replace(/".*$/, '');
                    });
                
                if (accuracyResults.length > 0) {
                    const formattedResults = accuracyResults.join('\n');
                    notes.push(formattedResults);
                    metrics.push({
                        name: 'Attack Results',
                        value: formattedResults
                    });
                    return { metrics, notes };
                }
            }
        }
    }
    
    // 特殊处理 ART_EA_ 开头的实现
    if (implementationId && implementationId.startsWith('ART_EA_')) {
        console.log('Processing ART EA implementation');
        
        if (Array.isArray(jsonData)) {
            // 提取准确率相关信息
            const accuracyResults = jsonData
                .filter(entry => {
                    const message = typeof entry === 'string' ? entry : entry.message;
                    return message && (
                        message.includes('Clean Accuracy') ||
                        message.includes('Accuracy under')
                    );
                })
                .map(entry => {
                    const message = typeof entry === 'string' ? entry : entry.message;
                    // 移除时间戳和日志级别信息，只保留准确率信息
                    return message
                        .replace(/^.*?Clean Accuracy:\t/, 'Clean Accuracy: ')
                        .replace(/^.*?Accuracy under/, 'Accuracy under')
                        .replace(/\t/g, ' ');
                });
            
            if (accuracyResults.length > 0) {
                const formattedResults = accuracyResults.join('\n');
                notes.push(formattedResults);
                metrics.push({
                    name: 'Accuracy Results',
                    value: formattedResults
                });
                return { metrics, notes };
            }
        }
    }
    
    // 特殊处理 Privacy_meter_ 开头的实现
    if (implementationId && implementationId.startsWith('Privacy_meter_')) {
        console.log('Processing Privacy meter implementation');
        
        // 如果是数组格式，将所有内容合并
        if (Array.isArray(jsonData)) {
            const fullContent = jsonData.map(entry => {
                if (typeof entry === 'string') return entry;
                return entry.message || JSON.stringify(entry, null, 2);
            }).join('\n');
            
            notes.push(fullContent);
            metrics.push({
                name: 'Privacy Meter Results',
                value: fullContent
            });
            return { metrics, notes };
        }
        // 如果是对象格式，格式化显示内容
        else if (typeof jsonData === 'object') {
            const formattedContent = Object.entries(jsonData)
                .map(([key, value]) => `"${key}": ${value}`)
                .join(',\n');
            
            notes.push(formattedContent);
            metrics.push({
                name: 'Privacy Meter Results',
                value: formattedContent
            });
            return { metrics, notes };
        }
    }
    
    // 特殊处理 Tensorflow_privacy_ 开头的实现
    if (implementationId && implementationId.startsWith('Tensorflow_privacy_')) {
        console.log('Processing Tensorflow privacy implementation');
        
        // 处理 JSON 格式的消息
        if (Array.isArray(jsonData)) {
            console.log('Processing array format data');
            // 查找包含 "Attack type with max AUC" 的消息
            const maxAucEntry = jsonData.find(entry => {
                if (typeof entry === 'string') {
                    return entry.includes('Attack type with max AUC');
                }
                return entry.message && entry.message.includes('Attack type with max AUC');
            });
            
            if (maxAucEntry) {
                const message = typeof maxAucEntry === 'string' ? maxAucEntry : maxAucEntry.message;
                console.log('Found max AUC message:', message);
                metrics.push({
                    name: 'Attack Results',
                    value: message
                });
                notes.push(message);
                return { metrics, notes };
            }
        }
        // 兼容处理旧格式
        else if (jsonData.messages && Array.isArray(jsonData.messages)) {
            console.log('Processing old format data');
            const maxAucMessage = jsonData.messages.find(msg => 
                msg.includes('Attack type with max AUC')
            );
            if (maxAucMessage) {
                console.log('Found max AUC message in old format:', maxAucMessage);
                metrics.push({
                    name: 'Attack Results',
                    value: maxAucMessage
                });
                notes.push(maxAucMessage);
                return { metrics, notes };
            }
        } else {
            console.log('No matching data format found');
        }
    }
    
    // 处理其他类型的实现
    if (jsonData.messages && Array.isArray(jsonData.messages)) {
        jsonData.messages.forEach(message => {
            // 提取指标值 (格式如: "Accuracy: 85%")
            const metricMatch = message.match(/([A-Za-z\s]+):\s*([0-9.]+%?)/);
            if (metricMatch) {
                metrics.push({
                    name: metricMatch[1].trim(),
                    value: metricMatch[2].trim()
                });
            }
            
            // 将所有消息作为分析说明
            notes.push(message);
        });
    }
    
    // 处理其他可能的字段
    if (jsonData.metrics && typeof jsonData.metrics === 'object') {
        Object.entries(jsonData.metrics).forEach(([key, value]) => {
            metrics.push({
                name: key,
                value: typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value.toString()
            });
        });
    }
    
    console.log(`Extracted results for ${implementationId}:`, { metrics, notes });
    return { metrics, notes };
}

/**
 * 生成报告样式
 * @param {Object} styleConfig - 样式配置
 * @return {string} - CSS样式
 */
export function generateReportStyles(styleConfig) {
    return `
        body {
            font-family: ${styleConfig.fontFamily};
            margin: 0;
            padding: 0;
            background-color: ${styleConfig.backgroundColor};
            color: #333;
            line-height: 1.6;
        }
        
        .ea-report {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${styleConfig.primaryColor};
        }
        
        .report-header h1 {
            color: ${styleConfig.primaryColor};
            margin-bottom: 10px;
        }
        
        .report-header h2 {
            color: ${styleConfig.secondaryColor};
            margin-top: 0;
        }
        
        .report-toc {
            margin: 30px 0;
            padding: 20px;
            background-color: #f5f7fa;
            border-radius: 5px;
        }
        
        .report-toc ol {
            margin-left: 20px;
        }
        
        .report-section {
            margin: 40px 0;
        }
        
        .report-section h2 {
            color: ${styleConfig.primaryColor};
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        
        .report-section h3 {
            color: ${styleConfig.secondaryColor};
            margin-top: 30px;
        }
        
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .report-table th, .report-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        .report-table th {
            background-color: #f5f7fa;
            font-weight: bold;
        }
        
        .report-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .process-records {
            background-color: #f5f7fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        .process-records pre {
            margin: 0;
            white-space: pre-wrap;
            font-family: monospace;
        }
        
        .analysis-result {
            margin: 30px 0;
            padding: 20px;
            background-color: #f9fbff;
            border-radius: 5px;
            border-left: 4px solid ${styleConfig.primaryColor};
        }
        
        .result-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        
        .metrics-summary {
            margin-top: 20px;
        }
        
        .result-data-block {
            width: 100%;
            text-align: left !important;
            margin: 0 !important;
            padding: 10px !important;
        }
        
        .no-image {
            padding: 40px;
            background-color: #f5f5f5;
            text-align: center;
            color: #999;
            border: 1px dashed #ddd;
        }
        
        .report-footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #777;
            font-size: 14px;
        }
        
        .architecture-diagram {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .architecture-diagram img {
            max-width: 90%;
            height: auto;
            border-radius: 4px;
        }
        
        .assessment-tools-table th:nth-child(1) { width: 15%; }
        .assessment-tools-table th:nth-child(2) { width: 30%; }
        .assessment-tools-table th:nth-child(3) { width: 15%; }
        .assessment-tools-table th:nth-child(4) { width: 10%; }
        .assessment-tools-table th:nth-child(5) { width: 30%; }
        
        .assessment-tools-table td {
            vertical-align: top;
            line-height: 1.4;
        }
        
        @media print {
            body {
                background-color: white;
            }
            
            .ea-report {
                padding: 0;
            }
            
            .report-section {
                page-break-inside: avoid;
            }
            
            .analysis-result {
                page-break-inside: avoid;
            }
        }
    `;
}

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, warning, info)
 */
export function showNotification(message, type = 'info') {
    // 如果存在通知系统，调用通知系统
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    
    // 简单的备用方案
    alert(message);
} 