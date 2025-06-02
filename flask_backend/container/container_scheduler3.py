import os
import sys
import docker
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def container_scheduler(attack_id, model_name=None, poison_rate=None, num_samples=None):
    """
    调度Docker容器来执行特定的攻击脚本
    
    参数:
    attack_id -- 攻击实现的ID
    model_name -- 用户上传模型的名称 (用于某些攻击类型)
    poison_rate -- 毒害率 (用于某些攻击类型)
    num_samples -- 样本数 (用于某些攻击类型)
    
    返回:
    "success" 如果攻击执行成功，否则返回错误消息
    """
    # 参数验证
    if attack_id.startswith(("Tensorflow_privacy_MIM_", "ART_EA_", "Privacy_meter_MIM_", "Privacy360_MIM_")):
        if not model_name:
            logger.error(f"Missing model_name for {attack_id}")
            return "error:missing_model_name"
    elif attack_id in ["ART_PA_003", "ART_PA_004", "ART_PA_006", "ART_PA_009"]:
        if poison_rate is None:
            logger.error(f"Missing poison_rate for {attack_id}")
            return "error:missing_poison_rate"
    elif attack_id == "ART_PA_007":
        if num_samples is None:
            logger.error(f"Missing num_samples for {attack_id}")
            return "error:missing_num_samples"

    # 动态配置参数
    command_params = []
    if attack_id.startswith("Tensorflow_privacy_MIM_"):
        docker_image = "lee074/robustai:mim-tensorflow2"
        model_extension = ".h5"
        command_params.append(f"--model_path /tf/models/{model_name}{model_extension}")
    elif attack_id.startswith("Privacy_meter_MIM_") or attack_id.startswith("Privacy360_MIM_"):
        docker_image = "lee074/robustai:privacymeter"
        model_extension = ".h5"
        command_params.append(f"--model_path /tf/models/{model_name}{model_extension}")
    elif attack_id.startswith("ART_EA_"):
        docker_image = "lee074/robustai:art_evasion"
        model_extension = ".pt"
        command_params.append(f"--model_path /tf/models/{model_name}{model_extension}")
    elif attack_id in ["ART_PA_003", "ART_PA_004", "ART_PA_006", "ART_PA_009"]:
        docker_image = "lee074/robustai:art-poison"
        command_params.append(f"--poison_rate {poison_rate}")
    elif attack_id == "ART_PA_007":
        docker_image = "lee074/robustai:art-poison"
        command_params.append(f"--num_samples {num_samples}")
    else:
        logger.error(f"Unsupported attack_id format: {attack_id}")
        return "error:unsupported_attack_id"

    # --- 硬编码主机路径 --- 
    logger.info("--- Using Hardcoded Host Paths --- ")
    #host_scripts_dir = "D:/Lee/robust-ai/Attack_Scripts" # 使用Windows路径格式
    #host_results_dir = "D:/Lee/robust-ai/Attack_Results"  # 使用Windows路径格式
    #host_models_dir = "D:/Lee/robust-ai/User_Models"    # 使用Windows路径格式
    host_scripts_dir = "/home/xueli/robustai/Attack_Scripts"  # Linux路径格式
    host_results_dir = "/home/xueli/robustai/Attack_Results"  # Linux路径格式
    host_models_dir = "/home/xueli/robustai/User_Models"     # Linux路径格式

    logger.info(f"Hardcoded Host Scripts Path: {host_scripts_dir}")
    logger.info(f"Hardcoded Host Results Path: {host_results_dir}")
    logger.info(f"Hardcoded Host Models Path: {host_models_dir}")
    # --- 结束硬编码 --- 
    
    # 容器内部路径
    container_scripts_dir = "/tf/scripts"
    container_results_dir = "/tf/results"
    container_models_dir = "/tf/models"
    
    # 在当前容器内部的路径 (用于检查文件是否存在 - 这部分逻辑现在不太相关，因为挂载是关键)
    local_scripts_dir = Path("/tf/scripts").resolve()
    local_results_dir = Path("/tf/results").resolve()
    local_models_dir = Path("/tf/models").resolve()
    
    # 验证攻击脚本 (在本地路径检查，这依赖于flaskend自身的挂载是否正确)
    attack_script = local_scripts_dir / f"{attack_id}.py"
    if not attack_script.exists():
        logger.error(f"Attack script {attack_script} not found in local path check! This indicates flaskend mount might be wrong.")
        return "error:script_not_found_local"

    # 验证模型文件（如果需要）(在本地路径检查)
    if model_name:
        user_upload_model = local_models_dir / f"{model_name}{model_extension}"
        if not user_upload_model.exists():
            logger.error(f"User upload model {user_upload_model} not found in local path check! This indicates flaskend mount might be wrong.")
            return "error:model_not_found_local"
            
    # 构建Docker命令
    base_command = f"python {container_scripts_dir}/{attack_id}.py"
    full_command = f"{base_command} {' '.join(command_params)}"
    logger.info(f"Executing command in container: {full_command}")
    
    # Docker客户端初始化
    client = docker.from_env()
    container = None

    try:
        logger.info("Starting Docker container...")
        logger.info(f"Docker image: {docker_image}")
        logger.info(f"Command: {full_command}")
        
        # 设置卷映射 (使用硬编码的 host_*_dir 变量)
        volumes = {
            host_scripts_dir: {'bind': container_scripts_dir, 'mode': 'rw'},
            host_results_dir: {'bind': container_results_dir, 'mode': 'rw'}
        }

        if model_name:
            volumes[host_models_dir] = {'bind': container_models_dir, 'mode': 'rw'}
            
        logger.info(f"--- Volume mappings passed to docker run ---: {volumes}")

        # 运行Docker容器
        container = client.containers.run(
            image=docker_image,
            command=full_command,
            volumes=volumes,
            detach=True,
        )
        
        # 实时处理日志
        exit_code = None
        has_error = False
        for line in container.logs(stream=True):
            log_line = line.decode().strip()
            logger.info(f"Container log: {log_line}")
            if "error" in log_line.lower() and "import" not in log_line.lower():  # 忽略导入相关的警告
                logger.error(f"Error detected in container log: {log_line}")
                has_error = True

        # 等待容器完成
        result = container.wait()
        exit_code = result['StatusCode']
        
        # 检查结果文件是否生成
        expected_json = f"{container_results_dir}/{attack_id}.json"
        expected_png = f"{container_results_dir}/{attack_id}.png"
        files_exist = os.path.exists(expected_json) or os.path.exists(expected_png)
        
        logger.info(f"Files check - JSON exists: {os.path.exists(expected_json)}, PNG exists: {os.path.exists(expected_png)}")
        
        if exit_code != 0:
            logger.error(f"Container exited with code {exit_code}")
            if files_exist:
                logger.info("Despite non-zero exit code, result files were generated")
                if not has_error:  # 如果没有检测到实际错误，认为是成功的
                    return "success"
            # 获取容器的最后100行日志用于调试
            last_logs = container.logs().decode().split('\n')[-100:]
            logger.error("Last 100 lines of container logs:")
            for log_line in last_logs:
                logger.error(log_line)
            return "error:execution_failed"

        # 如果退出码为0且文件已生成，返回成功
        if files_exist:
            logger.info("Attack completed successfully with result files generated")
            return "success"
        else:
            logger.error("No result files were generated despite successful exit code")
            return "error:no_output_files"

    except docker.errors.APIError as e:
        logger.error(f"Docker API error: {e}")
        logger.error(f"Failed volume mapping: {volumes}")
        return f"error:docker_api_error:{str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return f"error:unexpected:{str(e)}"
    finally:
        if container:
            try:
                container.stop()
                container.remove()
                logger.info("Container stopped and removed.")
            except Exception as cleanup_error:
                logger.error(f"Error during container cleanup: {cleanup_error}")
                
    logger.info(f"Attack {attack_id} completed successfully.")
    return "success"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Usage: python container_scheduler3.py <attack_id> [model_name|poison_rate|num_samples]")
        sys.exit(1)

    attack_id = sys.argv[1]
    params = sys.argv[2] if len(sys.argv) > 2 else None

    if attack_id.startswith(("Tensorflow_privacy_MIM_", "ART_EA_", "Privacy_meter_MIM_", "Privacy360_MIM_")):
        result = container_scheduler(attack_id, model_name=params)
    elif attack_id in ["ART_PA_003", "ART_PA_004", "ART_PA_006", "ART_PA_009"]:
        result = container_scheduler(attack_id, poison_rate=params)
    elif attack_id == "ART_PA_007":
        result = container_scheduler(attack_id, num_samples=params)
    else:
        logger.error("Unsupported attack_id")
        result = "error:unsupported_attack_id"
    
    sys.exit(0 if result == "success" else 1)