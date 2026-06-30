param(
    [string]$DownloadUrl = 'https://services.gradle.org/distributions/gradle-8.0.1-all.zip',
    [string]$Destination = 'C:\Users\dell\ITE109-FINAL-PROJECT\android\gradle-8.0.1-all.zip'
)
Write-Output "Destination: $Destination"
if (Test-Path $Destination) {
    Write-Output "Removing existing file"
    Remove-Item -Force $Destination
}
try {
    Write-Output "Downloading Gradle ZIP from $DownloadUrl"
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $Destination -UseBasicParsing -TimeoutSec 600
    Write-Output "Download complete"
} catch {
    Write-Output "Invoke-WebRequest failed: $_"
    Write-Output "Trying BITS Transfer instead"
    try {
        Start-BitsTransfer -Source $DownloadUrl -Destination $Destination -ErrorAction Stop
        Write-Output "BITS download complete"
    } catch {
        Write-Output "BITS download also failed: $_"
        exit 1
    }
}
if (-not (Test-Path $Destination)) {
    Write-Output "Download file missing after download"
    exit 1
}
$info = Get-Item $Destination
Write-Output "Downloaded file size: $($info.Length)"
$hash = Get-FileHash $Destination -Algorithm SHA256
Write-Output "SHA256: $($hash.Hash)"
try {
    Write-Output "Testing ZIP integrity by opening archive"
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Destination)
    $zip.Dispose()
    Write-Output "ZIP is readable"
} catch {
    Write-Output "ZIP integrity test failed: $_"
    exit 1
}
