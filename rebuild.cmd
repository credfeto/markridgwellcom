@echo off
SET mypath=%~dp0
SET MP=%mypath:~0,-1%
echo %MP%
call grunt rebuild
call gcloud app deploy %MP%\dst --project markridgwellcom -q