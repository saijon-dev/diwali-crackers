$root = "src/app"

Get-ChildItem -Path $root -Recurse -Filter *.ts |
Where-Object {
    $_.Name -notlike "*.spec.ts" -and
    (
        $_.Name -like "*.page.ts" -or
        $_.Name -like "*.service.ts" -or
        $_.Name -like "*.guard.ts" -or
        $_.Name -like "*.interceptor.ts" -or
        $_.Name -like "*.component.ts"
    )
} |
ForEach-Object {

    $directory = $_.DirectoryName
    $fileName = $_.BaseName
    $specFile = Join-Path $directory "$fileName.spec.ts"

    $className = ""

    if ($fileName -match "^(.*)\.page$") {
        $base = $matches[1]
        $className = (($base -split '-') | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ""
        $className += "Page"
    }
    elseif ($fileName -match "^(.*)\.service$") {
        $base = $matches[1]
        $className = (($base -split '-') | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ""
        $className += "Service"
    }
    elseif ($fileName -match "^(.*)\.guard$") {
        $base = $matches[1]
        $className = (($base -split '-') | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ""
        $className += "Guard"
    }
    elseif ($fileName -match "^(.*)\.interceptor$") {
        $base = $matches[1]
        $className = (($base -split '-') | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ""
        $className += "Interceptor"
    }
    elseif ($fileName -match "^(.*)\.component$") {
        $base = $matches[1]
        $className = (($base -split '-') | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ""
        $className += "Component"
    }

    if ($className -eq "") {
        return
    }

    $importPath = "./$fileName"

    $content = @"
import { describe, expect, it } from 'vitest';
import { $className } from '$importPath';

describe('$className', () => {

  it('should be defined', () => {
    expect($className).toBeDefined();
  });

});
"@

    Set-Content -Path $specFile -Value $content -Encoding UTF8

    Write-Host "Created: $specFile"
}