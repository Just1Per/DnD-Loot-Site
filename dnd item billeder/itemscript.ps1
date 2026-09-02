# --- CONFIGURATION ---
$FIREBASE_BUCKET = "dnd-loot-site.firebasestorage.app"
$INPUT_FILE      = "C:\Users\caspno\Desktop\Privat\dnd item billeder\firebase-items.json"
$COMPLETED_FILE  = "C:\Users\caspno\Desktop\Privat\dnd item billeder\completed-items.txt"

if (-not (Test-Path $COMPLETED_FILE)) { New-Item -Path $COMPLETED_FILE -ItemType File -Force | Out-Null }
$completedIds = Get-Content $COMPLETED_FILE -ErrorAction SilentlyContinue | ForEach-Object { $_.Trim() }

if (-not (Test-Path $INPUT_FILE)) { Write-Host "ERROR: File not found at $INPUT_FILE" -ForegroundColor Red; return }
$items = Get-Content $INPUT_FILE -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($item in $items) {
    $id          = [string]$item.id
    $name        = [string]$item.name
    $category    = [string]$item.category
    $description = [string]$item.description

    if ([string]::IsNullOrWhiteSpace($id) -or [string]::IsNullOrWhiteSpace($name)) { continue }
    if ($completedIds -contains $id) { continue }

    Write-Host "`n[Processing ID $id] $name..." -ForegroundColor Cyan
    $fileName = "$($name.ToLower() -replace '[^\w\s-]', '' -replace '\s+', '_').jpg"

    $promptText = "$name $category $description"
    Write-Host "Prompt: $promptText" -ForegroundColor Gray
    $encodedPrompt = [System.Uri]::EscapeDataString($promptText)

    $success = $false
    $attempts = 0

    while (-not $success -and $attempts -lt 5) {
        $attempts++
        try {
            $imageUrl = "https://image.pollinations.ai/prompt/$encodedPrompt?width=1024&height=1024&model=flux&nologo=true&seed=$(Get-Random)"
            
            $webResponse = Invoke-WebRequest -Uri $imageUrl -Headers @{ "User-Agent" = "Mozilla/5.0" } -UseBasicParsing
            $firebaseUrl = "https://firebasestorage.googleapis.com/v0/b/$FIREBASE_BUCKET/o?name=dnd_items%2F$fileName"
            $null = Invoke-RestMethod -Uri $firebaseUrl -Method Post -Headers @{ "Content-Type" = "image/jpeg" } -Body $webResponse.Content

            Write-Host "Uploaded: $fileName" -ForegroundColor Green
            Add-Content -Path $COMPLETED_FILE -Value $id
            $success = $true
            
            Start-Sleep -Seconds 6
        } catch {
            Write-Host "Error ($id) Attempt ${attempts}: ${_}" -ForegroundColor Red
            Write-Host "Rate limit hit or connection failed. Cooling down for 15 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
    }
}