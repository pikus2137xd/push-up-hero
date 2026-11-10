@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto python
start "" "http://localhost:8000"
py -m http.server 8000 --bind 127.0.0.1
goto end
:python
where python >nul 2>nul
if errorlevel 1 goto missing
start "" "http://localhost:8000"
python -m http.server 8000 --bind 127.0.0.1
goto end
:missing
echo Zainstaluj Python 3 z python.org. Instrukcja: INSTRUKCJA.html
:end
pause
