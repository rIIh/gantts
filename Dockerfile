FROM node:12-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM nginx:stable
ENV NODE_ENV='production'
COPY --from=build /usr/src/app/build /var/www/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

CMD ["nginx"]