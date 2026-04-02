$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$trackingUri = "sqlite:///$($baseDir -replace '\\', '/')/mlflow.db"
$artifactRoot = "file:///$($baseDir -replace '\\', '/')/mlruns"
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
