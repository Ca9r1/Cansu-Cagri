Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;

public static class WeddingLayerMaker
{
    static float Smooth(float value)
    {
        value = Math.Max(0f, Math.Min(1f, value));
        return value * value * (3f - 2f * value);
    }

    public static void Build(string sourcePath, string middlePath, string frontPath)
    {
        using (var source = new Bitmap(sourcePath))
        using (var middle = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        using (var front = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            int width = source.Width;
            int height = source.Height;

            for (int y = 0; y < height; y++)
            {
                float yn = y / (float)(height - 1);
                float middleVertical = Smooth((yn - 0.47f) / 0.28f);

                for (int x = 0; x < width; x++)
                {
                    Color pixel = source.GetPixel(x, y);
                    float xn = x / (float)(width - 1);
                    float edge = Math.Min(xn, 1f - xn) * 2f;
                    float spatialEdge = 1f - Smooth((edge - 0.12f) / 0.38f);
                    float bottomCorners = Smooth((yn - 0.57f) / 0.31f) * (1f - Smooth((edge - 0.28f) / 0.44f));
                    float foregroundSpatial = Math.Max(spatialEdge, bottomCorners);

                    float paperDistance = (float)Math.Sqrt(
                        Math.Pow(pixel.R - 246, 2) +
                        Math.Pow(pixel.G - 239, 2) +
                        Math.Pow(pixel.B - 225, 2));
                    float luminance = pixel.R * 0.2126f + pixel.G * 0.7152f + pixel.B * 0.0722f;
                    float colorDetail = Smooth((paperDistance - 8f) / 58f);
                    float darkDetail = Smooth((241f - luminance) / 70f);
                    float detail = Math.Max(colorDetail, darkDetail);

                    float centerBias = 0.58f + 0.42f * Smooth(edge / 0.75f);
                    int middleAlpha = (int)(255f * middleVertical * detail * centerBias);
                    int frontAlpha = (int)(255f * foregroundSpatial * detail);

                    middle.SetPixel(x, y, Color.FromArgb(Math.Max(0, Math.Min(255, middleAlpha)), pixel.R, pixel.G, pixel.B));
                    front.SetPixel(x, y, Color.FromArgb(Math.Max(0, Math.Min(255, frontAlpha)), pixel.R, pixel.G, pixel.B));
                }
            }

            middle.Save(middlePath, ImageFormat.Png);
            front.Save(frontPath, ImageFormat.Png);
        }
    }
}
'@

$drawingDir = Split-Path ([System.Drawing.Bitmap].Assembly.Location)
$drawingRefs = @(
    [System.Drawing.Bitmap].Assembly.Location,
    [System.Drawing.Color].Assembly.Location,
    (Join-Path $drawingDir 'System.Private.Windows.Core.dll'),
    (Join-Path $drawingDir 'System.Private.Windows.GdiPlus.dll')
) | Select-Object -Unique
Add-Type -TypeDefinition $code -ReferencedAssemblies $drawingRefs

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $projectDir 'dist\assets\invitation-art.png'
$middlePath = Join-Path $projectDir 'dist\assets\layer-mid.png'
$frontPath = Join-Path $projectDir 'dist\assets\layer-front.png'

[WeddingLayerMaker]::Build($sourcePath, $middlePath, $frontPath)
Write-Output $middlePath
Write-Output $frontPath
