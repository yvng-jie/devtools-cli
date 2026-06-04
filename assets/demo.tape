Output assets/demo.gif
Set Width 800
Set Height 560
Set FontSize 14
Set Theme Dracula
Set TypingSpeed 50ms
Set Framerate 15
Set PlaybackSpeed 1.5

# Show categorized help
Type "dt help"
Sleep 500ms
Enter
Sleep 3s
Ctrl+l

# Show some command examples
Type "dt uuid --count 3"
Sleep 300ms
Enter
Sleep 1.5s
Type "dt base64 encode hello world"
Sleep 300ms
Enter
Sleep 1.5s
Type "dt color coral"
Sleep 300ms
Enter
Sleep 2s
Ctrl+l

# JWT decode + Timestamp
Type "dt jwt eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"
Sleep 300ms
Enter
Sleep 2s
Type "dt ts now"
Sleep 300ms
Enter
Sleep 1.5s
Ctrl+l

# CIDR + hash
Type "dt cidr 10.0.0.0/8"
Sleep 300ms
Enter
Sleep 1.5s
Type "dt hash hello --algo sha256"
Sleep 300ms
Enter
Sleep 1.5s
Ctrl+l

# Interactive mode with search
Type "dt"
Sleep 300ms
Enter
Sleep 2s
Type "s"
Sleep 300ms
Enter
Sleep 500ms
Type "ip"
Sleep 200ms
Enter
Sleep 1s
Type "1"
Sleep 200ms
Enter
Sleep 1.5s
Type "b"
Sleep 200ms
Enter
Sleep 1s
Type "0"
Sleep 200ms
Enter
Sleep 500ms

