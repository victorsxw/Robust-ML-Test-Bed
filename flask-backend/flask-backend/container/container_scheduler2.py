# python container_scheduler2.py Tensorflow_privacy_MIM_001_test2 user_upload_for_test
# two argus，the first one is Implement ID name，the second is user upload model name

import os
import sys
import docker
import logging
from pathlib import Path

# initial logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

'''
def ensure_directory_exists(path):
    """确保主机上的路径存在"""
    path = Path(path)
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
    return path
'''

# 这个函数是临时添加的，功能是将命名不规范（名称中有太多空格）的attackk_id全部转换为用下划线连接的attack_id
def update_attack_id(attack_id):
    mapping = {
        "Tensorflow_privacy_MIM_001": "Tensorflow_privacy_MIM_001",
        "Tensorflow_privacy_MIM_002": "Tensorflow_privacy_MIM_002",
        "Tensorflow_privacy_MIM_003": "Tensorflow_privacy_MIM_003",
        "Tensorflow_privacy_MIM_004": "Tensorflow_privacy_MIM_004",
        "Tensorflow_privacy_MIM_005": "Tensorflow_privacy_MIM_005",
        "Tensorflow_privacy_MIM_006": "Tensorflow_privacy_MIM_006",
    }
    if attack_id in mapping:
        return mapping[attack_id]
    print("the attack_id is not in the mapping")
    return attack_id

def container_scheduler(attack_id, model_name):
    # check input argus
    if not attack_id or not model_name:
        logger.error("Usage: python container-scheduler.py <attack_id> <model_name>")
        sys.exit(1)

    attack_id = update_attack_id(attack_id)

    # Docker image
    docker_image = "lee074/tensorflow-privacy-library:mim-tensorflow2" # 根据本地的image名字修改，
    # docker_image = "tensorflow/tensorflow:2.13.0-jupyter"

    # Host OS: attack scripts, attack results, user upload model directories.
    attack_scripts_dir = Path(r"D:/Lee/robust-ai/Attack_Scripts").resolve()
    attack_results_dir = Path(r"D:/Lee/robust-ai/Attack_Results").resolve()
    user_upload_model_dir = Path(r"D:/Lee/robust-ai/User_Models").resolve()
    # model_path = ensure_directory_exists(model_path)  # 自动确保路径存在

    # check attack scripts and user upload model directories
    if not attack_scripts_dir.is_dir():
        logger.error(f"Attack scripts directory {attack_scripts_dir} not found!")
        sys.exit(1)

    if not user_upload_model_dir.is_dir():
        logger.error(f"User upload model directory {user_upload_model_dir} not found!")
        sys.exit(1)

    # check attack script (attack_id) and user upload model (model_name) whether exist?
    attack_script = attack_scripts_dir / f"{attack_id}.py"
    if not attack_script.exists():
        logger.error(f"Attack script {attack_script} not found!")
        sys.exit(1)

    user_upload_model = user_upload_model_dir / f"{model_name}.h5"
    if not user_upload_model.exists():
        logger.error(f"User upload model {user_upload_model} not found!")
        sys.exit(1)

    # initial Docker
    client = docker.from_env()

    container = None  # initial container
    try:
        logger.info("Starting Docker container...")
        container = client.containers.run(
            image=docker_image,
            command=f"python /tf/scripts/{attack_id}.py --model_path /tf/models/{model_name}.h5",
            volumes={
                str(attack_scripts_dir): {'bind': '/tf/scripts', 'mode': 'rw'},
                str(user_upload_model_dir): {'bind': '/tf/models', 'mode': 'rw'},
                str(attack_results_dir): {'bind': '/tf/results', 'mode': 'rw'}
            },
            detach=True
        )

        # logging
        for line in container.logs(stream=True):
            logger.info(line.decode().strip())

        '''
        # check attack result files (.json and .png)
        result_files = [f"/tf/results/{attack_id}.json", f"/tf/results/{attack_id}.png"]
        for file_path in result_files:
            try:
                bits, stat = container.get_archive(file_path)
                dest_path = attack_results_dir / Path(file_path).name
                with open(dest_path, 'wb') as f:
                    for chunk in bits:
                        f.write(chunk)
                logger.info(f"Copied {file_path} to {dest_path}")
            except docker.errors.NotFound:
                logger.warning(f"Result file {file_path} not found in container.")
            except Exception as e:
                logger.error(f"Error copying {file_path}: {e}")
        '''

    except docker.errors.APIError as e:
        logger.error(f"Docker API error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        # pause and delete the real-time container
        if container:
            try:
                container.stop()
                container.remove()
                logger.info("Container stopped and removed.")
            except Exception as cleanup_error:
                logger.error(f"Error during container cleanup: {cleanup_error}")

    return "success"


if __name__ == "__main__":
    if len(sys.argv) != 3:
        logger.error("Usage: python container_scheduler2.py <attack_id> <model_name>")
        sys.exit(1)

    attack_id = sys.argv[1]
    model_name = sys.argv[2]
    container_scheduler(attack_id, model_name)