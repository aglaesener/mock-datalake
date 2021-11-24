FROM postgres:14.1-alpine

COPY package*.json /

RUN apk update && apk add --update nodejs npm

# RUN npm install
COPY . .

CMD ["node", "index.js"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]