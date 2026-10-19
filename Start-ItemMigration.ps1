# Windows operator launcher. Prepare/check are read-only; apply always needs a plan digest.
param(
    [ValidateSet('Prepare','Check','Apply')][string]$Action='Prepare',
    [string]$CampaignId,
    [string]$OwnerId,
    [string]$PlanDirectory,
    [string]$BackupDirectory,
    [string]$ConfirmPlan
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Action -eq 'Prepare') {
    if ([bool]$CampaignId -eq [bool]$OwnerId) { throw 'Supply exactly one of -CampaignId or -OwnerId.' }
    if ($BackupDirectory -or $ConfirmPlan) { throw 'BackupDirectory and ConfirmPlan are not preparation options.' }
} else {
    if (-not $PlanDirectory) { throw 'Supply -PlanDirectory from the completed preparation.' }
    if ($CampaignId -or $OwnerId) { throw 'Check/apply use the identity already bound to the saved plan.' }
    if ($Action -eq 'Apply' -and $ConfirmPlan -notmatch '^[a-f0-9]{64}$') { throw 'Apply requires -ConfirmPlan with the exact printed SHA-256.' }
    if ($Action -eq 'Check' -and $ConfirmPlan) { throw 'Check does not accept production confirmation.' }
}
$node=Get-Command node.exe -ErrorAction Stop
$major=& $node.Source -p 'Number.parseInt(process.versions.node)'
if ($LASTEXITCODE -ne 0 -or @('22','24') -notcontains [string]$major) { throw 'Install Node 22 or 24 for Windows, then reopen PowerShell.' }
Push-Location -LiteralPath $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'functions/node_modules/firebase-admin/package.json'))) {
        $npm=Get-Command npm.cmd -ErrorAction Stop
        & $npm.Source ci --prefix functions --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. No migration was run.' }
    }
    $nodeArgs=@((Join-Path $PSScriptRoot 'scripts/prepare-authorized-library-migration.mjs'),$Action.ToLowerInvariant())
    if ($CampaignId) { $nodeArgs+=@('--campaign',$CampaignId) }
    if ($OwnerId) { $nodeArgs+=@('--owner',$OwnerId) }
    if ($PlanDirectory) { $nodeArgs+=@('--directory',$PlanDirectory) }
    if ($BackupDirectory) { $nodeArgs+=@('--backup-dir',$BackupDirectory) }
    if ($ConfirmPlan) { $nodeArgs+=@('--confirm-plan',$ConfirmPlan) }
    & $node.Source @nodeArgs
    if ($LASTEXITCODE -ne 0) { throw 'The operator stopped. Keep private files local and share only the status file or the error text.' }
} finally { Pop-Location }
