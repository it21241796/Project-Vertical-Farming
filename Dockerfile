FROM nginx:stable-alpine3.20-perl

ENV NGINX_HOME=/usr/share/nginx/html/
ENV NGINX_ETC=/etc/nginx/conf.d

USER root

COPY nginx.conf ${NGINX_ETC}
COPY build/* ${NGINX_HOME}

EXPOSE 9191