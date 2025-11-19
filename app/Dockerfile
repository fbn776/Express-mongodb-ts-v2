FROM node:24-alpine

WORKDIR /index
COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .
# Build TypeScript files to JavaScript
RUN npm run build
CMD ["npm", "start"]
