FROM nginx:latest
COPY . /var/www/application
RUN apt-get update
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install gunicorn flask mysql-connector-python
EXPOSE 8080