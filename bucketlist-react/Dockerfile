FROM node:alpine

RUN npm install -g gulp-cli serve

COPY . /

RUN npm install 

RUN gulp sass

CMD ["npm", "start"]











# i have to mount this volume to a host directory at container creation
# i.e docker run -d --name new-volume --mount source=/current/directory,\
# target=/holding-area node:latest
# VOLUME /holding-area
