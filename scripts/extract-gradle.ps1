$hash = '3uk5edsdkytjxrawwxy6uokhv'
$dest = "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.0.1-all\$hash"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Force 'C:\Users\dell\ITE109-FINAL-PROJECT\android\gradle-8.0.1-all.zip' -Destination (Join-Path $dest 'gradle-8.0.1-all.zip')
Write-Output "Extracting archive to $dest ..."
Expand-Archive -Force -Path (Join-Path $dest 'gradle-8.0.1-all.zip') -DestinationPath $dest
Write-Output "Extraction done. Listing files:"
Get-ChildItem $dest | Select-Object Name,Length | Format-Table -AutoSize
