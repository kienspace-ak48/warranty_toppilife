#Base image
FROM node:22

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy package trước để tối ưu cache
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8084

CMD ["npm", "start", "dev"]
