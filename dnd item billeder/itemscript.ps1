# ============================================================
# LOCAL COMFYUI + FIREBASE STORAGE ITEM GENERATOR
# ------------------------------------------------------------
# Reads firebase-items.json
# Generates images locally via ComfyUI API
# Uploads output images directly to Firebase Storage
# Tracks progress to avoid re-generating existing items
# ============================================================

# ---------------- CONFIGURATION ----------------
$COMFY_URL = "http://127.0.0.1:8188"
$CHECKPOINT = "sd_xl_base_1.0.safetensors"

$FIREBASE_BUCKET = "dnd-loot-site.firebasestorage.app"

$INPUT_FILE     = "C:\Users\caspno\Desktop\Privat\DnD-Loot-Site\dnd item billeder\firebase-items.json"
$COMPLETED_FILE = "C:\Users\caspno\Desktop\Privat\DnD-Loot-Site\dnd item billeder\completed-items.txt"
$FAILED_FILE    = "C:\Users\caspno\Desktop\Privat\DnD-Loot-Site\dnd item billeder\failed-items.txt"
$MANIFEST_FILE  = "C:\Users\caspno\Desktop\Privat\DnD-Loot-Site\dnd item billeder\generated-images.jsonl"

$TEMP_DIR = Join-Path $env:TEMP "dnd-item-generator"

# Leave empty if Firebase Storage security rules allow unauthenticated writes
$FIREBASE_AUTH_TOKEN = ""

# Generation Settings
$WIDTH = 1024
$HEIGHT = 1024
$STEPS = 30
$CFG = 7
$SAMPLER = "euler"
$SCHEDULER = "normal"
$TIMEOUT_SECONDS = 900
$RETRY_COUNT = 3
$DELAY_SECONDS = 2

# Set to 0 to process ALL items in firebase-items.json
$MAX_ITEMS = 0

# ------------------------------------------------------------

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Create directories and tracking files if missing
foreach ($path in @($TEMP_DIR)) {
    if (-not (Test-Path $path)) {
        New-Item -Path $path -ItemType Directory -Force | Out-Null
    }
}

foreach ($path in @($COMPLETED_FILE, $FAILED_FILE, $MANIFEST_FILE)) {
    if (-not (Test-Path $path)) {
        New-Item -Path $path -ItemType File -Force | Out-Null
    }
}

if (-not (Test-Path $INPUT_FILE)) {
    throw "Input file not found: $INPUT_FILE"
}

# ---------------- HELPERS ----------------

function Get-NormalizedKey([string]$value) {
    if ([string]::IsNullOrWhiteSpace($value)) { return "" }
    return (($value.ToLowerInvariant()) -replace '[^a-z0-9]', '')
}

function Get-LegacyImageName([string]$name) {
    $fileName = $name.ToLowerInvariant()
    $fileName = $fileName -replace '[^\w\s-]', ''
    $fileName = $fileName -replace '\s+', '_'
    return "$fileName.jpg"
}

function Get-CompletedEntries {
    $entries = @{
        Raw = @{}
        Normalized = @{}
    }

    if (-not (Test-Path $COMPLETED_FILE)) { return $entries }

    Get-Content $COMPLETED_FILE -ErrorAction SilentlyContinue | ForEach-Object {
        $line = $_.Trim()
        if (-not $line) { return }

        $firstPart = ($line -split '\s*\|\s*')[0].Trim()
        $entries.Raw[$line] = $true
        $entries.Raw[$firstPart] = $true

        foreach ($value in @($line, $firstPart)) {
            $withoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($value)
            $normalized = Get-NormalizedKey $withoutExtension
            if ($normalized) { $entries.Normalized[$normalized] = $true }
        }
    }

    return $entries
}

function Test-ItemCompleted($completedEntries, [string]$id, [string]$name) {
    if ($completedEntries.Raw.ContainsKey($id)) { return $true }
    
    $legacyName = Get-LegacyImageName $name
    if ($completedEntries.Raw.ContainsKey($legacyName)) { return $true }

    $nameKey = Get-NormalizedKey $name
    if ($nameKey -and $completedEntries.Normalized.ContainsKey($nameKey)) { return $true }

    return $false
}

function Add-CompletedId([string]$id) {
    Add-Content -Path $COMPLETED_FILE -Value $id -Encoding UTF8
}

function Add-FailedItem([string]$id, [string]$name, [string]$errorText) {
    $line = "{0} | {1} | {2}" -f $id, $name, ($errorText -replace "\r|\n", " ")
    Add-Content -Path $FAILED_FILE -Value $line -Encoding UTF8
}

function Test-ComfyConnection {
    try {
        $null = Invoke-RestMethod -Uri "$COMFY_URL/system_stats" -Method Get -TimeoutSec 15
        return $true
    }
    catch {
        return $false
    }
}

function New-ItemPrompt([string]$name, [string]$category, [string]$description) {
@"
Fantasy RPG magic item icon.

Item Name:
$name

Category:
$category

Description:
$description

Create a fantasy Dungeons and Dragons inventory icon. The artwork must visually represent the description.

Requirements:
- single magical item
- centered composition
- fantasy RPG style
- highly detailed
- dramatic fantasy lighting
- isolated object
- no person, hands, or character
- no text, words, watermark, or UI
- dark neutral background
"@
}

function New-ComfyWorkflow([string]$positivePrompt, [string]$negativePrompt, [int64]$seed) {
    return @{
        "1" = @{
            class_type = "CheckpointLoaderSimple"
            inputs = @{ ckpt_name = $CHECKPOINT }
        }
        "2" = @{
            class_type = "CLIPTextEncode"
            inputs = @{ text = $positivePrompt; clip = @("1", 1) }
        }
        "3" = @{
            class_type = "CLIPTextEncode"
            inputs = @{ text = $negativePrompt; clip = @("1", 1) }
        }
        "4" = @{
            class_type = "EmptyLatentImage"
            inputs = @{ width = $WIDTH; height = $HEIGHT; batch_size = 1 }
        }
        "5" = @{
            class_type = "KSampler"
            inputs = @{
                seed = $seed
                steps = $STEPS
                cfg = $CFG
                sampler_name = $SAMPLER
                scheduler = $SCHEDULER
                denoise = 1.0
                model = @("1", 0)
                positive = @("2", 0)
                negative = @("3", 0)
                latent_image = @("4", 0)
            }
        }
        "6" = @{
            class_type = "VAEDecode"
            inputs = @{ samples = @("5", 0); vae = @("1", 2) }
        }
        "7" = @{
            class_type = "SaveImage"
            inputs = @{ filename_prefix = "dnd_items"; images = @("6", 0) }
        }
    }
}

function Queue-ComfyPrompt($workflow, [string]$clientId) {
    $payload = @{ prompt = $workflow; client_id = $clientId } | ConvertTo-Json -Depth 30
    return Invoke-RestMethod -Uri "$COMFY_URL/prompt" -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 60
}

function Wait-ComfyResult([string]$promptId) {
    $deadline = (Get-Date).AddSeconds($TIMEOUT_SECONDS)

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2

        try {
            $history = Invoke-RestMethod -Uri "$COMFY_URL/history/$promptId" -Method Get -TimeoutSec 30
        }
        catch {
            continue
        }

        $entry = $history.$promptId
        if ($null -eq $entry) { continue }

        if ($null -ne $entry.status -and $entry.status.status_str -eq "error") {
            throw "ComfyUI reported an execution error for prompt $promptId"
        }

        if ($null -eq $entry.outputs) { continue }

        foreach ($nodeProperty in $entry.outputs.PSObject.Properties) {
            $nodeOutput = $nodeProperty.Value
            if ($null -eq $nodeOutput.images) { continue }

            foreach ($img in $nodeOutput.images) {
                if ($img.filename) { return $img }
            }
        }
    }

    throw "Timed out waiting for ComfyUI prompt $promptId"
}

function Download-ComfyImage($imageInfo, [string]$outputPath) {
    $query = @{
        filename  = $imageInfo.filename
        subfolder = $imageInfo.subfolder
        type      = $imageInfo.type
    }

    $queryString = ($query.GetEnumerator() | ForEach-Object {
        "{0}={1}" -f [Uri]::EscapeDataString([string]$_.Key), [Uri]::EscapeDataString([string]$_.Value)
    }) -join "&"

    $url = "$COMFY_URL/view?$queryString"
    
    $webClient = New-Object System.Net.WebClient
    try {
        $webClient.DownloadFile($url, $outputPath)
    }
    finally {
        $webClient.Dispose()
    }

    if (-not (Test-Path $outputPath)) { throw "ComfyUI image was not downloaded." }

    $size = (Get-Item $outputPath).Length
    if ($size -lt 1000) { throw "Downloaded image looks invalid or empty ($size bytes)." }
}

function Upload-ToFirebase([string]$localPath, [string]$storagePath) {
    $encodedName = [System.Uri]::EscapeDataString($storagePath)
    $url = "https://firebasestorage.googleapis.com/v0/b/$FIREBASE_BUCKET/o?uploadType=media&name=$encodedName"

    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($FIREBASE_AUTH_TOKEN)) {
        $headers["Authorization"] = "Bearer $FIREBASE_AUTH_TOKEN"
    }

    $bytes = [System.IO.File]::ReadAllBytes($localPath)

    Invoke-RestMethod `
        -Uri $url `
        -Method Post `
        -Headers $headers `
        -ContentType "image/png" `
        -Body $bytes `
        -TimeoutSec 120
}

# ---------------- EXECUTION START ----------------

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " LOCAL COMFYUI TO FIREBASE ITEM GENERATOR" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "ComfyUI:     $COMFY_URL"
Write-Host "Checkpoint:  $CHECKPOINT"
Write-Host "Firebase:    $FIREBASE_BUCKET"
Write-Host "Input File:  $INPUT_FILE"
Write-Host ""

if (-not (Test-ComfyConnection)) {
    throw "Cannot connect to ComfyUI at $COMFY_URL. Ensure ComfyUI is running first."
}

Write-Host "ComfyUI connection established." -ForegroundColor Green

$completedEntries = Get-CompletedEntries
$items = @(Get-Content $INPUT_FILE -Raw -Encoding UTF8 | ConvertFrom-Json)

if ($MAX_ITEMS -gt 0) {
    $items = @($items | Select-Object -First $MAX_ITEMS)
}

$total = $items.Count
$number = 0
$negativePrompt = "text, letters, words, typography, logo, watermark, UI, frame, border, caption, low quality, blurry, distorted, malformed object, duplicate objects, cropped item, hands, person"

foreach ($item in $items) {
    $number++

    $id = [string]$item.id
    $name = [string]$item.name
    $category = [string]$item.category
    $description = [string]$item.description

    if ([string]::IsNullOrWhiteSpace($id)) {
        Write-Host "[$number/$total] Skipping item with no ID." -ForegroundColor Yellow
        continue
    }

    if (Test-ItemCompleted $completedEntries $id $name) {
        Write-Host "[$number/$total] SKIP $id - already completed ($name)" -ForegroundColor DarkGray
        continue
    }

    Write-Host ""
    Write-Host "[$number/$total] Generating: $name" -ForegroundColor Cyan
    Write-Host "ID:       $id" -ForegroundColor Gray
    Write-Host "Target:   dnd-item-images/$id.png" -ForegroundColor Gray

    $positivePrompt = New-ItemPrompt $name $category $description
    $success = $false

    for ($attempt = 1; $attempt -le $RETRY_COUNT -and -not $success; $attempt++) {
        try {
            $seed = Get-Random -Minimum 1 -Maximum 2147483647
            $clientId = [guid]::NewGuid().ToString()
            $workflow = New-ComfyWorkflow $positivePrompt $negativePrompt $seed
            $queued = Queue-ComfyPrompt $workflow $clientId

            if ($null -eq $queued.prompt_id) {
                throw "ComfyUI did not return a prompt_id."
            }

            $promptId = [string]$queued.prompt_id
            Write-Host "Queued in ComfyUI (ID: $promptId, Seed: $seed)..." -ForegroundColor DarkGray

            $imageInfo = Wait-ComfyResult $promptId

            # Short local temp filename to avoid Windows MAX_PATH (260 char) errors
            $localFile = Join-Path $TEMP_DIR "item_$number.png"
            $storagePath = "dnd-item-images/$id.png"

            Download-ComfyImage $imageInfo $localFile
            Write-Host "Downloaded locally: $localFile" -ForegroundColor Green

            $null = Upload-ToFirebase $localFile $storagePath
            Write-Host "Uploaded to Firebase: $storagePath" -ForegroundColor Green

            # Append progress to text files
            Add-CompletedId $id
            $completedEntries.Raw[$id] = $true
            $completedEntries.Normalized[(Get-NormalizedKey $id)] = $true

            $manifestObject = @{
                id              = $id
                name            = $name
                storageFileName = "$id.png"
                storagePath     = $storagePath
                category        = $category
                description     = $description
            }

            $manifestObject | ConvertTo-Json -Compress | Add-Content -Path $MANIFEST_FILE -Encoding UTF8
            $success = $true

            if (Test-Path $localFile) {
                Remove-Item $localFile -Force -ErrorAction SilentlyContinue
            }

            Start-Sleep -Seconds $DELAY_SECONDS
        }
        catch {
            $errorText = $_.Exception.Message
            Write-Host "Attempt $attempt failed: $errorText" -ForegroundColor Red

            if ($attempt -lt $RETRY_COUNT) {
                Write-Host "Retrying in 10 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            }
            else {
                Add-FailedItem $id $name $errorText
                Write-Host "FAILED item: $id" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "BATCH PROCESSING COMPLETE" -ForegroundColor Cyan
Write-Host "Completed Log: $COMPLETED_FILE" -ForegroundColor Gray
Write-Host "Failed Log:    $FAILED_FILE" -ForegroundColor Gray
Write-Host "Manifest File: $MANIFEST_FILE" -ForegroundColor Gray
Write-Host "===============================================" -ForegroundColor Cyan