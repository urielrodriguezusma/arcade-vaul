Add-Type -AssemblyName presentationCore
$mp3Path = "C:\Uriel\Tutoriales\Claude_Fernando\claudecode-finished.mp3"
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]$mp3Path)
$player.Play()
Start-Sleep -Seconds 3
