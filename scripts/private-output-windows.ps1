# Called only by private-output.mjs. No credentials or file contents are read.
param(
    [Parameter(Mandatory=$true)][ValidateSet('Create','Inspect')][string]$Action,
    [Parameter(Mandatory=$true)][string]$LiteralPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$trusted = @($identity.Value, 'S-1-5-18', 'S-1-5-32-544')
function Assert-PathComponents([string]$Target) {
    $cursor = [System.IO.Path]::GetFullPath($Target)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force
            if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Private paths must not contain reparse points, junctions or cloud placeholders.' }
            # Untrusted principals must not be able to replace a path component.
            $acl = Get-Acl -LiteralPath $cursor
            foreach ($rule in $acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier])) {
                if ($rule.AccessControlType -ne 'Allow' -or ($rule.PropagationFlags -band [System.Security.AccessControl.PropagationFlags]::InheritOnly)) { continue }
                $danger = [System.Security.AccessControl.FileSystemRights]::Delete -bor [System.Security.AccessControl.FileSystemRights]::DeleteSubdirectoriesAndFiles -bor [System.Security.AccessControl.FileSystemRights]::ChangePermissions -bor [System.Security.AccessControl.FileSystemRights]::TakeOwnership
                if ($trusted -notcontains $rule.IdentityReference.Value -and (($rule.FileSystemRights -band $danger) -ne 0)) { throw 'An untrusted account can replace a private path component. Choose a directory under your local profile.' }
            }
        }
        $parent = [System.IO.Path]::GetDirectoryName($cursor)
        if (-not $parent -or $parent -eq $cursor) { break }
        $cursor = $parent
    }
}
Assert-PathComponents $LiteralPath
if ($Action -eq 'Create') {
    if (Test-Path -LiteralPath $LiteralPath) { throw 'Private directory already exists. Choose a new directory.' }
    $parent = [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($LiteralPath))
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'Private directory parent does not exist.' }
    $security = New-Object System.Security.AccessControl.DirectorySecurity
    $security.SetAccessRuleProtection($true,$false)
    $security.SetOwner($identity)
    foreach ($principal in $trusted) {
        $sid = New-Object System.Security.Principal.SecurityIdentifier($principal)
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($sid,[System.Security.AccessControl.FileSystemRights]::FullControl,([System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit),[System.Security.AccessControl.PropagationFlags]::None,[System.Security.AccessControl.AccessControlType]::Allow)
        $security.AddAccessRule($rule)
    }
    # Windows PowerShell 5.1/.NET Framework creates the directory with this DACL.
    $directory = New-Object System.IO.DirectoryInfo([System.IO.Path]::GetFullPath($LiteralPath))
    $directory.Create($security)
}
Assert-PathComponents $LiteralPath
$item = Get-Item -LiteralPath $LiteralPath -Force
$acl = Get-Acl -LiteralPath $LiteralPath
$rules = @($acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | ForEach-Object {
    @{ sid=$_.IdentityReference.Value; allow=($_.AccessControlType -eq 'Allow'); rights=[int64]$_.FileSystemRights; inheritOnly=(($_.PropagationFlags -band [System.Security.AccessControl.PropagationFlags]::InheritOnly) -ne 0) }
})
@{ currentSid=$identity.Value; ownerSid=$acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; directory=[bool]$item.PSIsContainer; reparse=(($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0); protected=[bool]$acl.AreAccessRulesProtected; rules=$rules } | ConvertTo-Json -Depth 5 -Compress
