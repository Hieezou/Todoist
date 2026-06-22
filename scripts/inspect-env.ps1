Write-Output "=== JAVA / PATH / SDK environment check ==="
Write-Output "JAVA_HOME = $env:JAVA_HOME"
Write-Output "PATH contains java.exe = $(if ($env:PATH -match 'java.exe|\\java\\bin') { 'YES' } else { 'NO' })"
Write-Output "ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT"
Write-Output "ANDROID_HOME = $env:ANDROID_HOME"
Write-Output "PATH contains platform-tools = $(if ($env:PATH -match 'platform-tools') { 'YES' } else { 'NO' })"
Write-Output ""
Write-Output "=== Known directories ==="
$dirs = @(
    'C:\Program Files\Java',
    'C:\Program Files\Java\jdk-17',
    'C:\Program Files\Java\jdk-21.0.11',
    'C:\Users\$env:USERNAME\AppData\Local\Android\Sdk',
    'C:\Android\Sdk',
    'C:\Android\sdk'
)
foreach ($dir in $dirs) {
    Write-Output "-- $dir"
    if (Test-Path $dir) {
        Get-ChildItem $dir -Force -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object { Write-Output "   $_" }
    } else {
        Write-Output "   MISSING"
    }
}
Write-Output ""
Write-Output "=== SDK tools check ==="
Get-Command sdkmanager -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "sdkmanager: $($_.Source)" }
Get-Command adb -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "adb: $($_.Source)" }
Get-Command java -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "java: $($_.Source)" }
Get-Command powershell -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "powershell: $($_.Source)" }
Write-Output ""
Write-Output "=== Installed JDK versions ==="
$javaDirs = Get-ChildItem 'C:\Program Files\Java' -Directory -ErrorAction SilentlyContinue
$javaDirs | ForEach-Object { Write-Output "  $_" }
