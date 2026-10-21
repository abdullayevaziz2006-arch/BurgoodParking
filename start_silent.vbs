Set WshShell = CreateObject("WScript.Shell")

' 1. Server allaqachon ishlab turganini tekshirish (1 soniya timeout bilan)
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
On Error Resume Next
http.Open "GET", "http://127.0.0.1:3001/api/tariff", False
http.setTimeouts 800, 800, 800, 800
http.Send

' 2. Agar server o'chiq bo'lsa, uni fonda 100% ko'rinmas qilib (0) ishga tushirish
If Err.Number <> 0 Or http.Status <> 200 Then
    WshShell.CurrentDirectory = "d:\Shlagbaun\backend"
    WshShell.Run """d:\Shlagbaun\node.exe"" index.js", 0, False
    WScript.Sleep 2500
End If
On Error GoTo 0

' 3. Brauzerda dastur sahifasini ochish (hech qanday qora CMD oynasisiz)
WshShell.Run "http://localhost:3001"
