param([string]$Printer, [string]$File)
$dll = Join-Path $PSScriptRoot "RawPrint.dll"
[System.Reflection.Assembly]::LoadFrom($dll) | Out-Null
$bytes = [System.IO.File]::ReadAllBytes($File)
if ([SmartPark.RawPrint]::Send($Printer, $bytes)) {
  Write-Output "OK"
} else {
  Write-Error "PRINT FAILED"
  exit 1
}
