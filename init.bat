@echo off
npx -y create-next-app@latest temp-next --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --yes --use-npm
xcopy /E /I /H /Y temp-next\* .
rmdir /S /Q temp-next
