@echo off
echo ========================================
echo Neon Tools - Electron 构建脚本
echo ========================================
echo.

REM 设置淘宝镜像
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo 已配置淘宝镜像加速下载
echo ELECTRON_MIRROR=%ELECTRON_MIRROR%
echo.

echo 开始构建...
echo 首次构建需要下载 Electron (~126MB)
echo 请耐心等待...
echo.

npm run build:dir

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo 构建成功！
    echo.
    echo 应用位置：release\win-unpacked\Neon Tools.exe
    echo.
    echo 可以直接运行测试！
) else (
    echo 构建失败，请检查网络连接
    echo 或尝试使用代理/VPN
)
echo ========================================
pause

