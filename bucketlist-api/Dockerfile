# this tells docker to build this image on top if python version 3.*
FROM python:3

RUN apt-get update

RUN pip install --upgrade pip

# here we are creating a folder named /app
RUN mkdir /app

COPY requirements.txt /app

# this is changing the current working directory to /app/bucketlist
# this is required since it is that folder where we find the requirements.txt
# file that essentially is a file that contains the application API dependencies
WORKDIR /app

# installing API dependencies
RUN pip install -r requirements.txt

# here we are copying all contents of the current folder where the dockerfile resides to the folder /app
COPY . /app

RUN chmod +x start-app.sh

# this is installing environment dependencies
RUN apt-get update -yqq \
  && apt-get install -yqq --no-install-recommends apt-utils\
    netcat \
  && apt-get -q clean


# exposing the flask application default port
EXPOSE 5000

CMD ["./start-app.sh"]
