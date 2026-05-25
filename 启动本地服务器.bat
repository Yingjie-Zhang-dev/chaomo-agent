@echo off
title 潮墨智能体 - 本地开发服务器
cd /d "%~dp0"
echo ========================================
echo  潮墨智能体本地服务器
echo ========================================
echo.
echo 启动中请访问: http://localhost:8080/index.html
echo 按 Ctrl+C 停止服务器
echo.
python -m http.server 8080
pause