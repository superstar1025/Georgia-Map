# Install Guide

# Project Title

Custom Map Application

## Getting Started

Please follow the below instruction get it running.

### Prerequisites

```
Apache server like Xampp, Wamp
https://www.apachefriends.org/index.html
https://www.apachefriends.org/download.html
```

### Installing

Please configure httpd.conf file on your xampp application folder
MacOS: Applications/XAMPP/xamppfiles/apache2/conf/httpd.conf

e.g:
```
    Listen 8081
    <VirtualHost *:8081>
        ServerAdmin georgiaMap.test
        DocumentRoot "/Volumes/DATA/Workspace/server-workstation/TempServer/usMap/"
        ServerName happylager.test
        ErrorLog "logs/dummy-host2.example.com-error.log"
        CustomLog "logs/dummy-host2.example.com-access.log" common
    </VirtualHost>
    # Custom Map project
    <Directory "/Volumes/DATA/Workspace/server-workstation/TempServer/usMap/">
            Options Indexes FollowSymLinks MultiViews
            AllowOverride all
            Order Deny,Allow
            Allow from all
            Require all granted
    </Directory>
```
You should replace DocumentRoot and Directory path with your project root path.

### Run

index.html file hosting server.


