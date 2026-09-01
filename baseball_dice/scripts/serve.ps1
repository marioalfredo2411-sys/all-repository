# Servidor estático mínimo para probar la PWA (sin Node).
#   powershell -ExecutionPolicy Bypass -File scripts\serve.ps1 [-Port 5000]
param([int]$Port = 5000)

$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.mjs'  = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
    '.woff2'= 'font/woff2'
    '.woff' = 'font/woff'
    '.map'  = 'application/json'
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    Write-Error "No se pudo abrir $prefix  ($($_.Exception.Message))"
    exit 1
}

Write-Host ""
Write-Host "  Baseball Dice PWA  ->  $prefix" -ForegroundColor Green
Write-Host "  Raiz: $Root"
Write-Host "  Ctrl+C para detener."
Write-Host ""

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
    } catch {
        break
    }
    $req = $ctx.Request
    $res = $ctx.Response
    $res.Headers['Service-Worker-Allowed'] = '/'
    $res.Headers['Cache-Control'] = 'no-cache'

    try {
        $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
        $path = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))

        if ((-not $path.StartsWith($Root)) -or (-not (Test-Path $path -PathType Leaf))) {
            $res.StatusCode = 404
            $buf = [System.Text.Encoding]::UTF8.GetBytes("404 - $rel")
            $res.OutputStream.Write($buf, 0, $buf.Length)
        } else {
            $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
            $ct = $mime[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
            $res.ContentType = $ct
            $bytes = [System.IO.File]::ReadAllBytes($path)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        Write-Host ("  {0,-4} {1}" -f $res.StatusCode, $rel)
    } catch {
        try { $res.StatusCode = 500 } catch {}
    } finally {
        $res.OutputStream.Close()
    }
}

$listener.Stop()
