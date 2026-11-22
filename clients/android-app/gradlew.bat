@echo off
setlocal
set APP_HOME=%~dp0
where gradle >nul 2>nul
if %ERRORLEVEL% equ 0 (
  gradle -p "%APP_HOME%" %*
) else (
  echo Gradle not found in PATH. Please open clients\android-app in Android Studio ^(Gradle 8.9^).
  exit /b 1
)
