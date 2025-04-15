@echo off
echo Démarrage de l'API ZoldStudio sur le port 5000...
cd %~dp0
cd ..
set PORT=5000
npm start
pause