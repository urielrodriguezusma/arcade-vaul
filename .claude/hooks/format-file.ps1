$ErrorActionPreference = "Continue"

$raw = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($raw)) {
    exit 0
}

try {
    $payload = $raw | ConvertFrom-Json
} catch {
    exit 0
}

$filePath = $payload.tool_input.file_path
if ([string]::IsNullOrWhiteSpace($filePath)) {
    exit 0
}

if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
    exit 0
}

$ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
$codeExtensions = @(".tsx", ".jsx", ".ts", ".js")
$markdownExtensions = @(".md", ".mdx")

if (-not ($codeExtensions -contains $ext -or $markdownExtensions -contains $ext)) {
    exit 0
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

npx prettier --write "$filePath" 2>&1 | Out-Null

if ($codeExtensions -contains $ext) {
    $eslintOutput = npx eslint --fix "$filePath" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ESLint encontro errores que no pudo autocorregir en $filePath`:`n$eslintOutput"
    }
}

exit 0
