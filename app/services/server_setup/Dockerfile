FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget tmux nano unzip libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    torchvision torchaudio \
    pandas scikit-learn matplotlib pillow \
    opencv-python-headless kaggle tqdm

WORKDIR /workspace
CMD ["bash"]