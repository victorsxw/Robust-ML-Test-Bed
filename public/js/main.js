// 全局变量
const state = {
    uploadedFileName: '',
    globalImplementationIDArray: []
};

// 文件上传处理
const fileUploadHandlers = {
    uploadModelFile() {
        handleFileUpload('modelFileInput', 'model', '.h5');
    },
    
    uploadDataset1() {
        handleFileUpload('dataset1Input', 'dataset1', '.csv');
    },
    
    uploadDataset2() {
        handleFileUpload('dataset2Input', 'dataset2', '.csv');
    },

    handleFileUpload(inputId, fileType, allowedExtension) {
        const fileInput = document.getElementById(inputId);
        const file = fileInput.files[0];
        
        if (!file) {
            alert(`Please select a file for ${fileType}`);
            return;
        }
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension !== allowedExtension.slice(1)) {
            alert(`Only ${allowedExtension} file format is allowed`);
            return;
        }
        
        uploadFileToServer(file, fileType);
    }
};

// API 调用
const api = {
    async uploadFileToServer(file, fileType) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fileType);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            state.uploadedFileName = file.name.replace(new RegExp(`\\${fileType === 'model' ? '.h5' : '.csv'}$`), '');
            alert(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file uploaded successfully`);

            if (data.success) {
                if (fileType === 'model') {
                    window.modelFileName = data.file.savedAs;
                    window.modelFilePath = data.file.path;
                } else if (fileType === 'train_dataset') {
                    window.trainDatasetFileName = data.file.savedAs;
                } else if (fileType === 'test_dataset') {
                    window.testDatasetFileName = data.file.savedAs;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error uploading ${fileType} file`);
        }
    },

    async sendToPython(selectedImplementations) {
        const pythonResult = document.getElementById('pythonResult');
        pythonResult.value = "Starting to process selected implementations...\n";

        for (const implementation_ID of selectedImplementations) {
            try {
                pythonResult.value += `\nProcessing Implementation ${implementation_ID}...\n`;
                
                const response = await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        implementation_ID,
                        upload_file_name: state.uploadedFileName
                    })
                });

                const data = await response.json();
                pythonResult.value += `Result for ${implementation_ID}: ${JSON.stringify(data)}\n`;
            } catch (error) {
                console.error('Error processing:', implementation_ID, error);
                pythonResult.value += `Error processing ${implementation_ID}: ${error.message}\n`;
            }
        }

        pythonResult.value += "\nAll selected implementations have been processed.";
    }
};

// UI 处理
const ui = {
    getSelectedImplementations() {
        const checkboxes = document.querySelectorAll('#implementation-checkboxes input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    },

    generateFinalReport() {
        const selectedImplementations = this.getSelectedImplementations();
        if (!selectedImplementations.length || !state.uploadedFileName) {
            alert('Please select implementations and upload required files');
            return;
        }

        const assessmentResult = document.getElementById('pythonResult').value;
        this.createPrintWindow(selectedImplementations, assessmentResult);
    },

    createPrintWindow(selectedImplementations, assessmentResult) {
        const printWindow = window.open('', '_blank');
        const template = this.getReportTemplate(selectedImplementations, assessmentResult);
        
        printWindow.document.write(template);
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.print();
        };
    },

    getReportTemplate(selectedImplementations, assessmentResult) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Security Assessment Report</title>
                ${this.getReportStyles()}
            </head>
            <body>
                ${this.getReportContent(selectedImplementations, assessmentResult)}
            </body>
            </html>
        `;
    }
};

// 页面加载初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadStoredResults();
});

// 导出获取选中实现的函数
export function getSelectedImplementations() {
    const checkboxes = document.querySelectorAll('#implementation-checkboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}