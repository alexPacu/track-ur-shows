FROM node:18-alpine

WORKDIR /app

# package files
COPY package*.json ./

# dependencies
RUN npm install

# source code
COPY . .

# next.js app
RUN npm run build

# port
EXPOSE 3000

# start
CMD ["npm", "start"]
