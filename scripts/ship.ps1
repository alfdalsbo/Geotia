[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Message,
  [switch]$SkipE2E,
  [switch]$NoDeploy,
  [switch]$StageAll
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

$npx = Resolve-LocalCommand "npx"
$branch = (git rev-parse --abbrev-ref HEAD).Trim()

if (-not $StageAll) {
  git diff --quiet
  $hasUnstagedTrackedChanges = $LASTEXITCODE -ne 0
  $untrackedChanges = git ls-files --others --exclude-standard
  if ($hasUnstagedTrackedChanges -or $untrackedChanges) {
    git status --short --branch
    throw "Ship refuses unstaged/untracked files by default. Stage intended files first, or rerun with -StageAll."
  }
}

& (Join-Path $PSScriptRoot "finish.ps1") -SkipE2E:$SkipE2E
if ($LASTEXITCODE -ne 0) {
  throw "finish.ps1 failed with exit code $LASTEXITCODE"
}

if ($StageAll) {
  Invoke-CheckedCommand "stage changes" "git" @("add", "-A")
}

git diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -ne 0
if ($hasStagedChanges) {
  Invoke-CheckedCommand "commit changes" "git" @("commit", "-m", $Message)
} else {
  Write-Host ""
  Write-Host "==> no staged changes to commit"
}

Invoke-CheckedCommand "push $branch" "git" @("push", "origin", $branch)

if ($branch -eq "main" -and -not $NoDeploy) {
  Invoke-CheckedCommand "deploy production" $npx @("vercel", "--prod", "--yes")
  Invoke-CheckedCommand "inspect production" $npx @("vercel", "inspect", "https://geotia.vercel.app")
} elseif ($NoDeploy) {
  Write-Host ""
  Write-Host "==> deploy skipped by -NoDeploy"
} else {
  Write-Host ""
  Write-Host "==> deploy skipped because branch is '$branch', not 'main'"
}

Write-Host ""
Write-Host "==> final git status"
git status --short --branch
$remaining = git status --porcelain
if ($remaining) {
  throw "Working tree is not clean after ship."
}
