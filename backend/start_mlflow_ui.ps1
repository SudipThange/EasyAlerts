$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $baseDir
$envFile = Join-Path $projectRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*$' -or $_ -match '^\s*#') {
            return
        }

        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
        }
    }
}

$mlflowDbPath = $env:MLFLOW_DB_PATH
if ([string]::IsNullOrWhiteSpace($mlflowDbPath)) {
    $mlflowDbPath = "mlflow.db"
}

$mlflowArtifactsDir = $env:MLFLOW_ARTIFACTS_DIR
if ([string]::IsNullOrWhiteSpace($mlflowArtifactsDir)) {
    $mlflowArtifactsDir = "mlruns"
}

if (-not [System.IO.Path]::IsPathRooted($mlflowDbPath)) {
    $mlflowDbPath = Join-Path $baseDir $mlflowDbPath
}

if (-not [System.IO.Path]::IsPathRooted($mlflowArtifactsDir)) {
    $mlflowArtifactsDir = Join-Path $baseDir $mlflowArtifactsDir
}

$trackingUri = "sqlite:///$($mlflowDbPath -replace '\\', '/')"
$artifactRoot = "file:///$($mlflowArtifactsDir -replace '\\', '/')"
$venvMlflow = Join-Path $baseDir "..\.venv\Scripts\mlflow.exe"

Write-Host "Starting MLflow UI"
Write-Host "Tracking URI: $trackingUri"
Write-Host "Artifact Root: $artifactRoot"
Write-Host "Open: http://127.0.0.1:5000"

if (Test-Path $venvMlflow) {
    & $venvMlflow ui --backend-store-uri $trackingUri --default-artifact-root $artifactRoot
} else {
    mlflow ui --backend-store-uri $trackingUri --default-artifact-root $artifactRoot
}
