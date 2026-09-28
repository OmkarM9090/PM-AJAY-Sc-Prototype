@echo off
REM One-command launcher for the JeevikaSetu prototype (Windows)
start "JeevikaSetu API" cmd /k "cd backend && python main.py"
timeout /t 3 >nul
start "JeevikaSetu Web" cmd /k "cd frontend && npm run dev"
