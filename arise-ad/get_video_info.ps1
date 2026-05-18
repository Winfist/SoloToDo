$s = New-Object -ComObject Shell.Application
$f = $s.Namespace("C:\Users\jwuck\OneDrive\Dokumente\SoloToDo\arise-ad\renders\mit zuarbeitederm video")
$i = $f.ParseName("Video Project 4.mp4")
for ($j = 0; $j -lt 350; $j++) {
    $val = $f.GetDetailsOf($i, $j)
    if ($val -and $val -ne "" -and $val -ne $null) {
        $name = $f.GetDetailsOf($f.Items, $j)
        Write-Host "${j}: ${name} = ${val}"
    }
}
