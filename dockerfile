FROM nginx:latest
COPY . /usr/share/nginx/html/application
RUN mv /usr/share/nginx/html/application/serverdata/application.conf /etc/nginx/conf.d/default.conf
RUN rm -rv /usr/share/nginx/html/application/serverdata
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install --break-system-packages gunicorn flask mysql-connector-python python-dotenv
RUN echo "cd /usr/share/nginx/html/application && nohup gunicorn --workers 3 --bind unix:/usr/share/nginx/html/application/application.sock wsgi:app" > /usr/share/nginx/html/application/start.sh
RUN chmod +x /usr/share/nginx/html/application/start.sh
RUN mv /usr/share/nginx/html/application/ssl/ /etc/nginx/ssl
