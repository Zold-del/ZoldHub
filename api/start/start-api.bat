@echo off
echo ======================================
echo      DÉMARRAGE DE L'API ZOLDSTUDIO
echo ======================================
echo.

cd ..\
echo Installation des dépendances...
call npm install

echo.
echo Vérification des variables d'environnement...
IF "%MONGODB_URI%"=="" (
  echo [AVERTISSEMENT] Variable MONGODB_URI non définie localement.
  echo L'API utilisera l'URI par défaut dans le code.
) ELSE (
  echo [OK] Variable MONGODB_URI définie.
)

IF "%JWT_SECRET%"=="" (
  echo [AVERTISSEMENT] Variable JWT_SECRET non définie localement.
  echo La sécurité des jetons JWT pourrait être compromise.
) ELSE (
  echo [OK] Variable JWT_SECRET définie.
)

echo.
echo Démarrage du serveur API...
echo.
echo ======================================
echo L'API sera accessible à http://localhost:5000
echo Utilisez Ctrl+C pour arrêter le serveur
echo ======================================
echo.

npm run dev