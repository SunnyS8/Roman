# Generates a server-ready config.yaml from the local one.
# Changes tts_provider: silero -> edge-tts (no PyTorch needed on the server),
# keeps all API keys. Output: deploy\config.server.yaml
$src = Join-Path $env:USERPROFILE ".betsy\config.yaml"
$dst = Join-Path $PSScriptRoot "config.server.yaml"

if (-not (Test-Path -LiteralPath $src)) {
  Write-Error "Local config not found: $src"
  exit 1
}

$content = Get-Content -LiteralPath $src -Raw -Encoding UTF8

# silero -> edge-tts (voice works via pip-installed CLI on the server)
$content = $content -replace 'tts_provider:\s*silero', 'tts_provider: edge-tts'
$content = $content -replace '(?m)^\s*silero_speaker:.*$', ''

Set-Content -LiteralPath $dst -Value $content -Encoding UTF8
Write-Host "Server config written to: $dst"
Write-Host "Check it (keys + tts_provider: edge-tts) and upload to the server as ~/.betsy/config.yaml"