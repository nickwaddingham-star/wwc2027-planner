# Local preview server. Serves only the files in this folder, only to this computer.
param([int]$Port = 8765)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff2' = 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    try {
      $path = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
      if ($path -eq '') { $path = 'index.html' }
      $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
      $type = $types[[System.IO.Path]::GetExtension($file).ToLowerInvariant()]

      # Refuse anything outside this folder and any file type the site does not use.
      if ($file.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and $type -and (Test-Path -LiteralPath $file -PathType Leaf)) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $response.ContentType = $type
        $response.Headers.Add('Cache-Control', 'no-store')
        $response.ContentLength64 = $bytes.Length
        if ($context.Request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $response.StatusCode = 404
        Write-Output "404 $path"
      }
    } catch {
      Write-Output "Request failed: $($_.Exception.Message)"
    } finally {
      try { $response.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
