# Genera todos los iconos PNG (+ favicon.ico y screenshot) de Baseball Dice
# usando GDI+ (System.Drawing). No requiere Node ni ImageMagick.
#   Uso:  powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1

Add-Type -AssemblyName System.Drawing

$OutDir = Join-Path $PSScriptRoot '..\icons'
$OutDir = [System.IO.Path]::GetFullPath($OutDir)
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

function New-DiceBallBitmap {
    param([int]$Size, [bool]$Maskable)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # --- fondo verde (a sangre) ---
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 36, 82, 49),
        [System.Drawing.Color]::FromArgb(255, 15, 36, 22),
        45.0)
    $g.FillRectangle($bg, $rect)
    $bg.Dispose()

    # espacio de trabajo 0..512; para maskable encogemos el contenido a la zona segura
    $g.ScaleTransform([single]($Size / 512.0), [single]($Size / 512.0))
    if ($Maskable) {
        $g.TranslateTransform(256, 256)
        $g.ScaleTransform(0.78, 0.78)
        $g.TranslateTransform(-256, -256)
    }

    # ================= DADO =================
    $st = $g.Save()
    $g.TranslateTransform(198, 200)
    $g.RotateTransform(-15)

    $dx = -132; $dy = -130; $dw = 264; $dh = 264; $r = 46; $d = $r * 2
    $die = New-Object System.Drawing.Drawing2D.GraphicsPath
    $die.AddArc($dx, $dy, $d, $d, 180, 90)
    $die.AddArc($dx + $dw - $d, $dy, $d, $d, 270, 90)
    $die.AddArc($dx + $dw - $d, $dy + $dh - $d, $d, $d, 0, 90)
    $die.AddArc($dx, $dy + $dh - $d, $d, $d, 90, 90)
    $die.CloseFigure()

    $sh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, 0, 0, 0))
    $g.TranslateTransform(9, 12); $g.FillPath($sh, $die); $g.TranslateTransform(-9, -12)
    $sh.Dispose()

    $dieRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
    $dieBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $dieRect,
        [System.Drawing.Color]::FromArgb(255, 250, 247, 240),
        [System.Drawing.Color]::FromArgb(255, 217, 204, 184),
        90.0)
    $g.FillPath($dieBrush, $die)
    $dieBrush.Dispose()

    $dieBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 139, 94, 60), 7)
    $g.DrawPath($dieBorder, $die)
    $dieBorder.Dispose()
    $die.Dispose()

    $pip = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 57, 43))
    $pr = 21
    foreach ($p in @(@(0.235, 0.235), @(0.765, 0.235), @(0.5, 0.5), @(0.235, 0.765), @(0.765, 0.765))) {
        $cx = $dx + $p[0] * $dw
        $cy = $dy + $p[1] * $dh
        $g.FillEllipse($pip, ($cx - $pr), ($cy - $pr), ($pr * 2), ($pr * 2))
    }
    $pip.Dispose()
    $g.Restore($st)

    # ================= PELOTA =================
    $st = $g.Save()
    $g.TranslateTransform(328, 332)
    $br = 130

    $sh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(76, 0, 0, 0))
    $g.FillEllipse($sh, (-$br + 11), (-$br + 15), ($br * 2), ($br * 2))
    $sh.Dispose()

    $ballRect = New-Object System.Drawing.Rectangle((-$br), (-$br), ($br * 2), ($br * 2))
    $ballPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ballPath.AddEllipse($ballRect)
    $ball = New-Object System.Drawing.Drawing2D.PathGradientBrush($ballPath)
    $ball.CenterPoint = New-Object System.Drawing.PointF((-$br * 0.32), (-$br * 0.34))
    $ball.CenterColor = [System.Drawing.Color]::White
    $ball.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 221, 224, 228))
    $g.FillPath($ball, $ballPath)
    $ball.Dispose()

    $g.SetClip($ballPath)

    $seam = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 57, 43), 11)
    $seam.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $seam.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    # costura izquierda: circulo centro (-210,0) r150  -> abomba hacia el centro
    $g.DrawArc($seam, -360, -150, 300, 300, -45, 90)
    # costura derecha: circulo centro (210,0) r150
    $g.DrawArc($seam, 60, -150, 300, 300, 135, 90)
    $seam.Dispose()

    $tick = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 57, 43), 6)
    $tick.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tick.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $L = @(@(-95, -96, -113, -101), @(-73, -61, -91, -64), @(-61, -21, -79, -22),
           @(-61, 21, -79, 22), @(-73, 61, -91, 64), @(-95, 96, -113, 101))
    foreach ($t in $L) { $g.DrawLine($tick, $t[0], $t[1], $t[2], $t[3]) }
    foreach ($t in $L) { $g.DrawLine($tick, -$t[0], $t[1], -$t[2], $t[3]) }
    $tick.Dispose()

    $g.ResetClip()
    $ballPath.Dispose()
    $g.Restore($st)

    $g.Dispose()
    return $bmp
}

function Save-Png {
    param([System.Drawing.Bitmap]$Bitmap, [string]$Path)
    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  $([System.IO.Path]::GetFileName($Path))  ($($Bitmap.Width)x$($Bitmap.Height))"
}

Write-Host "Generando iconos en $OutDir"

# --- iconos "any" ---
foreach ($s in 16, 32, 48, 64, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024) {
    $b = New-DiceBallBitmap -Size $s -Maskable $false
    Save-Png -Bitmap $b -Path (Join-Path $OutDir "icon-$s.png")
    $b.Dispose()
}

# --- alias con nombres conocidos ---
Copy-Item (Join-Path $OutDir 'icon-180.png') (Join-Path $OutDir 'apple-touch-icon.png') -Force
Copy-Item (Join-Path $OutDir 'icon-32.png')  (Join-Path $OutDir 'favicon-32.png') -Force
Copy-Item (Join-Path $OutDir 'icon-16.png')  (Join-Path $OutDir 'favicon-16.png') -Force

# --- iconos maskable ---
foreach ($s in 192, 512) {
    $b = New-DiceBallBitmap -Size $s -Maskable $true
    Save-Png -Bitmap $b -Path (Join-Path $OutDir "icon-maskable-$s.png")
    $b.Dispose()
}

# --- favicon.ico (16 / 32 / 48) ---
function New-Ico {
    param([string[]]$PngPaths, [string]$IcoPath)
    $imgs = $PngPaths | ForEach-Object { [System.IO.File]::ReadAllBytes($_) }
    $fs = [System.IO.File]::Create($IcoPath)
    $bw = New-Object System.IO.BinaryWriter($fs)
    $bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$imgs.Count)
    $offset = 6 + 16 * $imgs.Count
    for ($i = 0; $i -lt $imgs.Count; $i++) {
        $side = @(16, 32, 48)[$i]
        $bw.Write([byte]($side -band 0xFF)); $bw.Write([byte]($side -band 0xFF))
        $bw.Write([byte]0); $bw.Write([byte]0)
        $bw.Write([uint16]1); $bw.Write([uint16]32)
        $bw.Write([uint32]$imgs[$i].Length); $bw.Write([uint32]$offset)
        $offset += $imgs[$i].Length
    }
    foreach ($d in $imgs) { $bw.Write($d) }
    $bw.Flush(); $bw.Close(); $fs.Close()
    Write-Host "  favicon.ico  (16/32/48)"
}
New-Ico -PngPaths @(
    (Join-Path $OutDir 'icon-16.png'),
    (Join-Path $OutDir 'icon-32.png'),
    (Join-Path $OutDir 'icon-48.png')
) -IcoPath (Join-Path $OutDir '..\favicon.ico')

# --- screenshot para el manifest (marca, no captura real) ---
$W = 1080; $H = 1920
$scr = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($scr)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 26, 58, 34),
    [System.Drawing.Color]::FromArgb(255, 12, 28, 17), 90.0)
$g.FillRectangle($bg, $bgRect); $bg.Dispose()
$logo = New-DiceBallBitmap -Size 620 -Maskable $false
$g.DrawImage($logo, (($W - 620) / 2), 470, 620, 620)
$logo.Dispose()
$title = New-Object System.Drawing.Font('Arial Black', 78, [System.Drawing.FontStyle]::Bold)
$sub = New-Object System.Drawing.Font('Arial', 32)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
$cream = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 240, 232))
$gold = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 212, 160, 23))
$g.DrawString("BASEBALL DICE", $title, $cream, (New-Object System.Drawing.RectangleF(0, 1210, $W, 130)), $fmt)
$g.DrawString("Solo vs CPU   -   Multijugador", $sub, $gold, (New-Object System.Drawing.RectangleF(0, 1330, $W, 70)), $fmt)
$scr.Save((Join-Path $OutDir 'screenshot-portrait.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $scr.Dispose()
Write-Host "  screenshot-portrait.png  (1080x1920)"

Write-Host "Listo."
