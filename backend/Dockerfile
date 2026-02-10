FROM node:22.2.0-alpine

WORKDIR /app

COPY ./smart-economat-backend ./

RUN npm install

RUN npm run build

CMD ["npm", "run", "start:prod"]
