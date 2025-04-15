FROM node:18-alpine AS builder

WORKDIR /app

# Ajout de labels pour la documentation
LABEL maintainer="ZoldStudio"
LABEL version="1.0.0"
LABEL description="API ZoldStudio"

# Copier uniquement les fichiers de dépendances pour exploiter le cache Docker
COPY package*.json ./

# Installation des dépendances avec mise en cache
RUN npm ci --only=production

# Deuxième étape pour réduire la taille de l'image finale
FROM node:18-alpine

# Utiliser un utilisateur non-root pour améliorer la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copier les dépendances installées depuis l'étape précédente
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Changer la propriété des fichiers pour l'utilisateur non-root
RUN chown -R appuser:appgroup /app

# Changer vers l'utilisateur non-root
USER appuser

# Exposer le port correct (5000 d'après votre code)
EXPOSE 5000

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck pour vérifier que l'application fonctionne
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O - http://localhost:5000/health || exit 1

CMD ["npm", "start"]