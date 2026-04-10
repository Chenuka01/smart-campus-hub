@echo off
@setlocal

set "ERROR_CODE=0"

@REM To isolate internal variables from possible setting of calling script
set "WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain"

set "MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%"
IF NOT "%MAVEN_PROJECTBASEDIR%"=="" goto endReadBaseDir

set "MAVEN_PROJECTBASEDIR=%~dp0"
:stripPD
if not "_%MAVEN_PROJECTBASEDIR:~-1%"=="_\" goto endReadBaseDir
set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
goto stripPD

:endReadBaseDir

@REM Find the project base dir, i.e. the directory that contains the folder ".mvn".
@REM Fallback to current working directory if not found.

set "EXEC_DIR=%CD%"
set "W_DIR=%CD%"
:findBaseDir
IF EXIST "%W_DIR%\.mvn" (
  set "MAVEN_PROJECTBASEDIR=%W_DIR%"
  goto baseDirFound
)
cd ..
IF "%W_DIR%"=="%CD%" goto baseDirNotFound
set "W_DIR=%CD%"
goto findBaseDir

:baseDirNotFound
set "MAVEN_PROJECTBASEDIR=%EXEC_DIR%"
cd "%EXEC_DIR%"

:baseDirFound
cd "%EXEC_DIR%"

IF "%MAVEN_BATCH_ECHO%" == "on"  echo %MAVEN_BATCH_ECHO%

@REM Java Environment Variable Functions
@REM ----------------------------------------------------------------------------
@REM Check JAVA_HOME
if not "%JAVA_HOME%" == "" goto checkJavaHome
echo.
echo Error: JAVA_HOME not found in your environment. >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error

:checkJavaHome
if exist "%JAVA_HOME%\bin\java.exe" goto init

echo.
echo Error: JAVA_HOME is set to an invalid directory. >&2
echo JAVA_HOME = "%JAVA_HOME%" >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error
@REM ----------------------------------------------------------------------------

:init

@REM Re-set BASEDIR to the project base directory
set "BASEDIR=%MAVEN_PROJECTBASEDIR%"

@REM  Find the wrapper jar
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

@REM  Find the java executable
set "JAVACMD=%JAVA_HOME%\bin\java.exe"

set "MAVEN_CMD_LINE_ARGS=%*"

"%JAVACMD%" ^
  %MAVEN_OPTS% ^
  -classpath "%WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  %WRAPPER_LAUNCHER% %MAVEN_CMD_LINE_ARGS%
if ERRORLEVEL 1 goto error
goto end

:error
set "ERROR_CODE=1"

:end
@endlocal & set "ERROR_CODE=%ERROR_CODE%"

if not "%MAVEN_BATCH_PAUSE%" == "on" goto skipPause
:pause
pause
:skipPause

exit /B %ERROR_CODE%
