<#
setup-android-env.ps1
Detects installed JDK and common Android SDK locations and sets user environment variables.
Run this script in a PowerShell (may require restart of terminal windows after setx).
#>

Write-Output "Detecting JDK installations..."
$possibleJdks = @(
    'C:\Program Files\Java\jdk-21.0.11',
    'C:\Program Files\Java\jdk-17',
    'C:\Program Files\Java\jdk-17.0.1',
    'C:\Program Files\Java\jdk-11'
)
$foundJdk = $possibleJdks | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($foundJdk) {
    Write-Output "Found JDK at: $foundJdk"
    setx JAVA_HOME $foundJdk | Out-Null
    Write-Output "Set user JAVA_HOME to $foundJdk (restart terminals to apply)."
} else {
    Write-Output "No JDK found in common locations. Please install JDK 17 or set JAVA_HOME manually."
}

Write-Output "Detecting Android SDK..."
$possibleSdks = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)
$foundSdk = $possibleSdks | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($foundSdk) {
    Write-Output "Found Android SDK at: $foundSdk"
    setx ANDROID_SDK_ROOT $foundSdk | Out-Null
    Write-Output "Set user ANDROID_SDK_ROOT to $foundSdk (restart terminals to apply)."
    $pt = "$foundSdk\platform-tools"
    if (Test-Path $pt) {
        # Append platform-tools to user PATH (preserve existing)
        $currentPath = [Environment]::GetEnvironmentVariable('Path','User')
        if ($currentPath -notlike "*$pt*") {
            $newPath = "$currentPath;$pt"
            setx PATH $newPath | Out-Null
            Write-Output "Appended platform-tools to user PATH (restart terminals to apply)."
        } else {
            Write-Output "platform-tools already in user PATH."
        }
    } else {
        Write-Output "platform-tools not found under $foundSdk; install platform-tools with sdkmanager."
    }
} else {
    Write-Output "No Android SDK found. Install Android Studio or the command-line SDK and re-run this script."
}

Write-Output "Done. After restarting your terminal (or sign out/in) run:"
Write-Output "  cd android && .\\gradlew assembleRelease --no-daemon"
