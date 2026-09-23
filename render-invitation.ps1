param(
  [string]$BackgroundPath = (Join-Path $PSScriptRoot 'source-assets/invitation-background.png'),
  [string]$FontPath = (Join-Path $PSScriptRoot 'source-assets/fonts/CormorantGaramond-Regular.ttf'),
  [string]$OutputPath = (Join-Path $PSScriptRoot 'dist/assets/invitation.png')
)

Add-Type -AssemblyName System.Drawing

$background = [System.Drawing.Image]::FromFile($BackgroundPath)
$bitmap = New-Object System.Drawing.Bitmap($background.Width, $background.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bitmap.SetResolution(144, 144)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.DrawImage($background, 0, 0, $bitmap.Width, $bitmap.Height)

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile($FontPath)
$family = $fonts.Families[0]

$navy = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 43, 70))
$slate = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 48, 70, 90))
$coral = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 180, 93, 73))
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(205, 184, 145, 68), 2)
$pinPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 16, 43, 70), 4)

function New-InviteFont([float]$size) {
  return New-Object System.Drawing.Font($family, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-CenteredText {
  param(
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$Y,
    [float]$Height,
    [float]$Inset = 90
  )
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::None
  $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip
  $rect = New-Object System.Drawing.RectangleF($Inset, $Y, ($bitmap.Width - (2 * $Inset)), $Height)
  $graphics.DrawString($Text, $Font, $Brush, $rect, $format)
  $format.Dispose()
}

$fontHeader = New-InviteFont 34
$fontName = New-InviteFont 132
$fontAmpersand = New-InviteFont 62
$fontDate = New-InviteFont 50
$fontVenue = New-InviteFont 44
$fontAddress = New-InviteFont 27
$fontFamily = New-InviteFont 31
$fontClosing = New-InviteFont 35

Draw-CenteredText 'DÜĞÜNÜMÜZE DAVETLİSİNİZ' $fontHeader $slate 155 55 160
Draw-CenteredText 'Cansu' $fontName $navy 220 160 130
Draw-CenteredText '&' $fontAmpersand $coral 356 78 130
Draw-CenteredText 'Çağrı' $fontName $navy 420 170 130

$graphics.DrawLine($goldPen, 315, 602, 807, 602)
Draw-CenteredText '31 EKİM 2026  ·  18.30' $fontDate $navy 615 65 130

$venueText = 'SUARE EVENT'
$venueSize = $graphics.MeasureString($venueText, $fontVenue)
$venueX = (($bitmap.Width - $venueSize.Width) / 2)
$pinX = $venueX - 42
$pinY = 696
$pinPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$pinPath.AddBezier($pinX + 14, $pinY + 34, $pinX + 2, $pinY + 19, $pinX + 3, $pinY + 7, $pinX + 14, $pinY + 4)
$pinPath.AddBezier($pinX + 14, $pinY + 4, $pinX + 25, $pinY + 7, $pinX + 26, $pinY + 19, $pinX + 14, $pinY + 34)
$graphics.DrawPath($pinPen, $pinPath)
$graphics.DrawEllipse($pinPen, $pinX + 10, $pinY + 11, 8, 8)
$pinPath.Dispose()
Draw-CenteredText $venueText $fontVenue $navy 680 62 170
Draw-CenteredText 'Cami mah, Balıkçılar Sk. No:14/1, 34000 Tuzla/İstanbul' $fontAddress $slate 735 54 155

$graphics.DrawLine($goldPen, 390, 801, 732, 801)
Draw-CenteredText 'TÜRKAN & NEVAİP İSKENDER' $fontFamily $slate 820 48 150
Draw-CenteredText 'SARE & UFUK TERZİBAŞ' $fontFamily $slate 862 48 150
Draw-CenteredText 'Sevincimizi paylaşmanız dileğiyle…' $fontClosing $navy 925 58 150

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$fontHeader.Dispose()
$fontName.Dispose()
$fontAmpersand.Dispose()
$fontDate.Dispose()
$fontVenue.Dispose()
$fontAddress.Dispose()
$fontFamily.Dispose()
$fontClosing.Dispose()
$pinPen.Dispose()
$goldPen.Dispose()
$navy.Dispose()
$slate.Dispose()
$coral.Dispose()
$fonts.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
$background.Dispose()

Write-Output $OutputPath
