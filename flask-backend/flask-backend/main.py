from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Flask API is running"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/process', methods=['POST'])
def process():
    try:
        data = request.get_json()
        implementation_id = data.get('implementation_ID')
        upload_file_name = data.get('upload_file_name')
        
        # 这里添加你的处理逻辑
        
        return jsonify({
            "status": "success",
            "message": f"Processing {implementation_id} with file {upload_file_name}"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)