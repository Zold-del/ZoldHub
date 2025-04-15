FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

RUN npm install --production

# Copier tout le code source
COPY . .

EXPOSE 3000

CMD ["npm", "start"]