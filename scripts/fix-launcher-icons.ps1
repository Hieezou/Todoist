$base = Join-Path $PSScriptRoot '..\android\app\src\main\res'
$pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='
$png = [System.Convert]::FromBase64String($pngBase64)
$dirs = @('mipmap-hdpi','mipmap-mdpi','mipmap-xhdpi','mipmap-xxhdpi','mipmap-xxxhdpi')
foreach ($d in $dirs) {
    $dir = Join-Path $base $d
    if (-not (Test-Path $dir)) {
        Write-Host "Skipping missing $dir"
        continue
    }
    foreach ($name in @('ic_launcher.png','ic_launcher_foreground.png')) {
        $path = Join-Path $dir $name
        [System.IO.File]::WriteAllBytes($path, $png)
        Write-Host "Wrote $path length=$($png.Length)"
    }
}
