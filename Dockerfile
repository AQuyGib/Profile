# Sử dụng image Node.js 24 Alpine siêu nhẹ
FROM node:24-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json trước để tận dụng cache của Docker layers
COPY package*.json ./

# Cài đặt các dependencies
RUN npm ci

# Sao chép toàn bộ mã nguồn của dự án vào container
COPY . .

# Khai báo cổng chạy ứng dụng (Express server chạy ở cổng 3000)
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]
