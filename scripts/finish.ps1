[CmdletBinding()]
param(
  [switch]$SkipE2E,
  [switch]$RequireClean,
  [switch]$KeepDevServers
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $repoRoot

function Resolve-LocalCommand {
  param([Parameter(Mandatory = $true)][string]$Name)

  $windowsCommand = Get-Command "$Name.cmd" -ErrorAction SilentlyContinue
  if ($windowsCommand) {
    return $windowsCommand.Source
  }

  return $Name
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Command,
    [string[]]$Arguments = @()
  )

  Write-Host ""
  Write-Host "==> $Label"
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

function Stop-RepoDevServers {
  $repoNeedle = $repoRoot.ToLowerInvariant()
  $candidates = Get-CimInstance Win32_Process |
    Where-Object {
      if (-not $_.CommandLine) {
        return $false
      }

      $commandLine = $_.CommandLine.ToLowerInvariant()
      $looksLikeNextDev = $commandLine.Contains("next") -and $commandLine.Contains("dev")
      $looksLikeRepo = $commandLine.Contains($repoNeedle) -or $commandLine.Contains("geotia-web")
      return $looksLikeNextDev -and $looksLikeRepo
    }

  foreach ($candidate in $candidates) {
    Write-Host "Stopping local dev server PID $($candidate.ProcessId)"
    Stop-Process -Id $candidate.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

$npm = Resolve-LocalCommand "npm"
$npx = Resolve-LocalCommand "npx"

if (-not $KeepDevServers) {
  Stop-RepoDevServers
}

Invoke-CheckedCommand "lint" $npm @("run", "lint")
Invoke-CheckedCommand "unit tests" $npm @("run", "test")
Invoke-CheckedCommand "production build" $npm @("run", "build")

if (-not $SkipE2E) {
  Invoke-CheckedCommand "mobile Playwright smoke" $npx @("playwright", "test", "tests/mobile.spec.ts", "--project=mobile-chromium")
}

if (-not $KeepDevServers) {
  Stop-RepoDevServers
}

Write-Host ""
Write-Host "==> git status"
$porcelain = git status --porcelain
git status --short --branch

if ($RequireClean -and $porcelain) {
  throw "Working tree is not clean."
}
