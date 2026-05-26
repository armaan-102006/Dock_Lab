FROM python:latest
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    apt-get clean

EXPOSE 8000
CMD ["bash"]
