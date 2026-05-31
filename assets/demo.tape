Output assets/demo.gif
Set Width 800
Set Height 520
Set FontSize 14
Set Theme Dracula
Set TypingSpeed 50ms
Set Framerate 15
Set PlaybackSpeed 1.5

Type "node dist/index.js help"
Sleep 500ms
Enter
Sleep 2s
Ctrl+l

Type "node dist/index.js uuid"
Sleep 300ms
Enter
Sleep 1.5s
Type "node dist/index.js uuid --count 3"
Sleep 300ms
Enter
Sleep 1.5s
Ctrl+l

Type "node dist/index.js base64 encode hello world"
Sleep 300ms
Enter
Sleep 1.5s
Type "node dist/index.js color coral"
Sleep 300ms
Enter
Sleep 2s
Ctrl+l

Type "node dist/index.js jwt eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"
Sleep 300ms
Enter
Sleep 2s
Ctrl+l

Type "node dist/index.js hash hello --algo sha256"
Sleep 300ms
Enter
Sleep 1.5s
Type "node dist/index.js ts now"
Sleep 300ms
Enter
Sleep 1.5s
Type "node dist/index.js ts now --json"
Sleep 300ms
Enter
Sleep 1.5s
Ctrl+l

Type "echo hello pipe"
Sleep 300ms
Type " | node dist/index.js base64 encode"
Sleep 300ms
Enter
Sleep 1.5s
