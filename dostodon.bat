rem set a HTTP proxy
rem SET PROXY_HOST=http://192.168.2.9:8888

rem set a SOCKS5 proxy
rem SET PROXY_HOST=192.168.2.9
rem SET PROXY_PORT=1080
rem SET PROXY_TYPE=SOCKS

@dojs.exe -r dstdn.js %1 %2 %3
