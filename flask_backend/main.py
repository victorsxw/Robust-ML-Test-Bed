from flask import Flask, request, jsonify
from flask_cors import CORS
import container.container_scheduler3 as scheduler
import time
import os
import logging

app = Flask(__name__)
CORS(app)

# Add basic logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 添加根路由，返回API状态和可用端点
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "API is running",
        "available_endpoints": ["/process"]
    })

@app.route('/process', methods=['POST'])
def process_data():
    start_time = time.time()
    try:
        data_list = request.json
        logger.info("Received request data: %s", data_list)
        
        if not isinstance(data_list, list):
            logger.error("Request body is not a JSON array")
            return jsonify({"error": "Request body must be a JSON array"}), 400

        results = []
        logger.info(f"Processing request with data: {data_list}")
        for data in data_list:
            imp_id = None
            try:
                logger.info("Processing data item: %s", data)
                required_fields = ["implementation_ID"]
                if not all(field in data for field in required_fields):
                    logger.warning(f"Missing required fields in data item: {data}")
                    results.append({"error": "Missing required fields"})
                    continue

                imp_id = data["implementation_ID"]
                logger.info(f"Processing implementation: {imp_id}")

                # 确定需要传递的参数
                params = {}
                if imp_id.startswith(("Tensorflow_privacy_MIM_", "ART_EA_", "Privacy_meter_MIM_", "Privacy360_MIM_")):
                    if "upload_file_name" not in data:
                        logger.warning(f"Missing upload_file_name for {imp_id} in data: {data}")
                        results.append({"error": f"Missing upload_file_name for {imp_id}"})
                        continue
                    # Remove extension from filename if present before passing
                    file_name_base = os.path.splitext(data["upload_file_name"])[0]
                    params = {'model_name': file_name_base}
                    logger.info(f"Using model file: {file_name_base} for {imp_id}")
                    
                elif imp_id in ["ART_PA_003", "ART_PA_004", "ART_PA_006", "ART_PA_009"]:
                    if "poison_rate" not in data:
                        logger.warning(f"Missing poison_rate for {imp_id} in data: {data}")
                        results.append({"error": f"Missing poison_rate for {imp_id}"})
                        continue
                    params = {'poison_rate': data["poison_rate"]}
                    logger.info(f"Using poison_rate: {data['poison_rate']} for {imp_id}")
                    
                elif imp_id == "ART_PA_007":
                    if "num_samples" not in data:
                        logger.warning(f"Missing num_samples for {imp_id} in data: {data}")
                        results.append({"error": f"Missing num_samples for {imp_id}"})
                        continue
                    params = {'num_samples': data["num_samples"]}
                    logger.info(f"Using num_samples: {data['num_samples']} for {imp_id}")

                # 调用调度器处理单个任务
                logger.info(f"Calling container_scheduler for {imp_id} with params: {params}")
                try:
                    result = scheduler.container_scheduler(
                        attack_id=imp_id,
                        **params
                    )
                    logger.info(f"Scheduler result for {imp_id}: {result}")
                except Exception as scheduler_error:
                    logger.error(f"Scheduler error for {imp_id}: {str(scheduler_error)}", exc_info=True)
                    result = f"error:scheduler_error:{str(scheduler_error)}"

                if result == "success":
                    results.append({"status": f"Processed {imp_id} success"})
                else:
                    logger.error(f"Scheduler failed for {imp_id}. Result: {result}")
                    results.append({"error": f"Failed to process {imp_id}: {result}"})

            except Exception as e:
                error_message = f"Error processing {imp_id if imp_id else 'unknown implementation'}. Exception Type: {type(e).__name__}, Message: {str(e)}"
                logger.error(error_message, exc_info=True)
                results.append({"error": error_message})

        logger.info(f"Finished processing all items. Results: {results}")
        return jsonify({"results": results})

    except Exception as e:
        error_message = f"Outer exception during /process. Exception Type: {type(e).__name__}, Message: {str(e)}"
        logger.error(error_message, exc_info=True)
        return jsonify({"error": error_message}), 500
    finally:
        end_time = time.time()
        total_time = end_time - start_time
        logger.info(f"Total time for /process request: {total_time:.2f} s")

# 健康检查端点
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/check-results', methods=['GET'])
def check_results():
    implementation_id = request.args.get('implementation_id')
    if not implementation_id:
        return jsonify({"error": "Missing implementation_id parameter"}), 400

    # 检查结果文件
    results_dir = "/tf/results"  # 使用容器内的路径
    json_path = os.path.join(results_dir, f"{implementation_id}.json")
    png_path = os.path.join(results_dir, f"{implementation_id}.png")
    
    files_exist = os.path.exists(json_path) or os.path.exists(png_path)
    
    return jsonify({
        "implementation_id": implementation_id,
        "files_exist": files_exist,
        "json_exists": os.path.exists(json_path),
        "png_exists": os.path.exists(png_path)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  ##原为：：，因为在NRC dockers中运行，所以改为0.0.0.0