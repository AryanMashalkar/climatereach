@echo off
cd /d "%~dp0"
if not exist "node_modules\vinext" (
  echo Please run npm ci in this folder first.
  pause
  exit /b 1
)
node scripts/run-framework.mjs dev
