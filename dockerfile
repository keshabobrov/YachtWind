FROM nginx:latest
COPY . /usr/share/nginx/html/application
RUN mv /usr/share/nginx/html/application/serverdata/application.conf /etc/nginx/conf.d/default.conf
RUN rm -rv /usr/share/nginx/html/application/serverdata
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install gunicorn flask mysql-connector-python
RUN echo "cd /usr/share/nginx/html/application && gunicorn --workers 3 --bind unix:/usr/share/nginx/html/application/application.sock wsgi:app" > /usr/share/nginx/html/application/start.sh
RUN chmod +x /usr/share/nginx/html/application/start.sh