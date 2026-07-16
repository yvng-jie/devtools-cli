Output assets/demo.gif
Set Width 800
Set Height 520
Set FontSize 14
Set Theme Dracula
Set TypingSpeed 50ms
Set Framerate 12
Set PlaybackSpeed 1.5

# 1. Categorized help
Type "dt help"
Sleep 300ms
Enter
Sleep 3s
Ctrl+l

# 2. UUID + base64
Type "dt uuid --count 3"
Sleep 200ms
Enter
Sleep 1.5s
Type "dt base64 encode hello world"
Sleep 200ms
Enter
Sleep 1s
Type "dt base64 decode aGVsbG8gd29ybGQ="
Sleep 200ms
Enter
Sleep 1.5s
Ctrl+l

# 3. Color + JWT
Type "dt color coral"
Sleep 200ms
Enter
Sleep 1s
Type "dt color '#ff7f50' --json"
Sleep 200ms
Enter
Sleep 1.5s
Type "dt jwt eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"
Sleep 200ms
Enter
Sleep 2s
Ctrl+l

# 4. IP + CIDR
Type "dt ip 8.8.8.8"
Sleep 200ms
Enter
Sleep 1.5s
Type "dt cidr 192.168.1.0/24"
Sleep 200ms
Enter
Sleep 1.5s
Ctrl+l

# 5. Hash + math + semver
Type "dt hash hello --algo sha256"
Sleep 200ms
Enter
Sleep 1.5s
Type "dt math '2^10'"
Sleep 200ms
Enter
Sleep 1s
Type "dt semver 1.2.3 --bump patch"
Sleep 200ms
Enter
Sleep 1.5s
Ctrl+l

# 6. Number + bytes + timestamp
Type "dt number 255"
Sleep 200ms
Enter
Sleep 1s
Type "dt bytes 1073741824"
Sleep 200ms
Enter
Sleep 1s
Type "dt ts now"
Sleep 200ms
Enter
Sleep 1.5s
Ctrl+l

# 7. QR code + interactive mode
Type "dt qrcode https://github.com/yvng-jie/devtools-cli"
Sleep 200ms
Enter
Sleep 2s
Ctrl+l

# 8. Interactive mode
Type "dt"
Sleep 200ms
Enter
Sleep 2s
Type "s"
Sleep 200ms
Enter
Sleep 500ms
Type "ip"
Sleep 100ms
Enter
Sleep 1s
Type "b"
Sleep 100ms
Enter
Sleep 500ms
Type "0"
Sleep 100ms
Enter
Sleep 1s
