Add-Type -AssemblyName System.Drawing

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $projectDir 'dist\assets\invitation-art.png'
$outputPath = Join-Path $projectDir 'dist\assets\invitation.png'

$source = [System.Drawing.Image]::FromFile($sourcePath)
$canvas = New-Object System.Drawing.Bitmap 1080, 1350
$canvas.SetResolution(144, 144)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.DrawImage($source, 0, 0, 1080, 1350)

$ink = [System.Drawing.Color]::FromArgb(255, 19, 44, 69)
$coral = [System.Drawing.Color]::FromArgb(255, 174, 91, 72)
$gold = [System.Drawing.Color]::FromArgb(255, 174, 132, 58)
$muted = [System.Drawing.Color]::FromArgb(255, 67, 83, 95)
$inkBrush = New-Object System.Drawing.SolidBrush $ink
$coralBrush = New-Object System.Drawing.SolidBrush $coral
$goldPen = New-Object System.Drawing.Pen $gold, 2
$mutedBrush = New-Object System.Drawing.SolidBrush $muted

$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
$center.LineAlignment = [System.Drawing.StringAlignment]::Center

$small = New-Object System.Drawing.Font 'Segoe UI', 18, ([System.Drawing.FontStyle]::Regular)
$names = New-Object System.Drawing.Font 'Georgia', 82, ([System.Drawing.FontStyle]::Regular)
$amp = New-Object System.Drawing.Font 'Georgia', 38, ([System.Drawing.FontStyle]::Italic)
$date = New-Object System.Drawing.Font 'Georgia', 28, ([System.Drawing.FontStyle]::Regular)
$venue = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Regular)
$family = New-Object System.Drawing.Font 'Georgia', 17, ([System.Drawing.FontStyle]::Regular)

function Draw-CenteredText($text, $font, $brush, $y, $height) {
  $rect = New-Object System.Drawing.RectangleF 210, $y, 660, $height
  $graphics.DrawString($text, $font, $brush, $rect, $center)
}

Draw-CenteredText 'DÜĞÜNÜMÜZE DAVETLİSİNİZ' $small $mutedBrush 205 42
Draw-CenteredText 'Cansu' $names $inkBrush 280 115
Draw-CenteredText '&' $amp $coralBrush 382 70
Draw-CenteredText 'Çağrı' $names $inkBrush 442 115

$graphics.DrawLine($goldPen, 315, 595, 765, 595)
Draw-CenteredText '31 EKİM 2026  ·  18.30' $date $inkBrush 620 55
Draw-CenteredText 'SUARE EVENT · TUZLA' $venue $mutedBrush 685 48

$graphics.DrawLine($goldPen, 385, 778, 695, 778)
Draw-CenteredText 'TÜRKAN & NEVAİP İSKENDER' $family $mutedBrush 800 38
Draw-CenteredText 'SARE & UFUK TERZİBAŞ' $family $mutedBrush 845 38
Draw-CenteredText 'Sevincimizi paylaşmanız dileğiyle…' $family $inkBrush 920 48

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$small.Dispose()
$names.Dispose()
$amp.Dispose()
$date.Dispose()
$venue.Dispose()
$family.Dispose()
$inkBrush.Dispose()
$coralBrush.Dispose()
$mutedBrush.Dispose()
$goldPen.Dispose()
$graphics.Dispose()
$canvas.Dispose()
$source.Dispose()

Write-Output $outputPath
