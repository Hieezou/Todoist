Set-Location "C:\Users\dell\ITE109-FINAL-PROJECT\android"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.11"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
java -version
.\gradlew assembleRelease --stacktrace
