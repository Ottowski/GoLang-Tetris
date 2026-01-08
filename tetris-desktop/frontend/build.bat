@echo off
rmdir /S /Q dist 2>nul
mkdir dist
xcopy /E /I /Y tetris dist
mkdir dist\src\tetris 2>nul
xcopy /E /I /Y src\tetris\* dist\src\tetris\
