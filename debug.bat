@echo off
cd /d "%~dp0"

set PATH=%USERPROFILE%\.bun\bin;%PATH%

if not exist "node_modules\tsx\package.json" (
    echo Installing dependencies...
    set ELECTRON_SKIP_BINARY_DOWNLOAD=1
    bun install
)

set AIONUI_BACKEND_BIN=F:\MyWork\develop\XAIWork\AionCore\target\debug\aioncore.exe

if not exist "%AIONUI_BACKEND_BIN%" (
    echo Building aioncore ^(debug^)...
    cd /d F:\MyWork\develop\XAIWork\AionCore
    set PATH=C:\Users\Administrator\AppData\Local\puccinialin\puccinialin\Cache\rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%
    cargo build --bin aioncore
    cd /d "%~dp0"
)

:: out/renderer must exist for webhost to start (one-time build if missing)
if not exist "out\renderer\index.html" (
    echo First run: building renderer...
    bun run package
)

:: Start webhost (backend + API) in a separate window, skip rebuild
start "AionUi WebHost" cmd /c "set PATH=%USERPROFILE%\.bun\bin;%PATH% && set AIONUI_BACKEND_BIN=%AIONUI_BACKEND_BIN% && set AIONUI_OPEN_BROWSER=0 && bun run webui --no-build"

:: Wait for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Vite dev server with HMR — open http://localhost:5173
echo.
echo  HMR dev server: http://localhost:5173
echo.
start "" http://localhost:5173
bunx vite --config vite.webui-dev.config.ts
