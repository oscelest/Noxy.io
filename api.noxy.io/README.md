# Setup

## Environmentals

To run this project, it is necessary to create a .env file which is not included in the source code. It should contain the following values:

```
ADMIN_EMAIL = EMAIL_FOR_THE_ADMIN_ACCOUNT
ADMIN_USERNAME = USERNAME_FOR_THE_ADMIN_ACCOUNT
ADMIN_PASSWORD = PASSWORD_FOR_THE_ADMIN_ACCOUNT

DB_HOST = 127.0.0.1
DB_PORT = 3306
DB_USERNAME = YOUR_DATABASE_USER
DB_PASSWORD = PASSWORD_MATCHING_USER
DB_DATABASE = THE_DATABASE_IN_YOUR_DATABASE

CACHE_HOST = 127.0.0.1
CACHE_PORT = 6379
CACHE_PASSWORD = PASSWORD_TO_BE_SET_IN_REDIS

FILE_HOST = 127.0.0.1
FILE_PORT = 41735
FILE_SECRET = LONG_AND_SECURE_SECRET

NODE_ENV = PRODUCTION_OR_DEVELOPMENT

JWT_SECRET = YOUR_SECRET
```

## Database

This project uses [TypeORM](https://github.com/typeorm/typeorm) TypeORM to handle database connections and entities.

While TypeORM supports a lot of different databases, this implementation is geared towards MySQL. Only minor changes should be necessary to support a different database. This is however not a priority
for this project currently.

____

#### Drivers

To communicate with your chosen database, the relevant database driver npm package will need to be installed. For MySQL run either of the following:

```
npm install mysql
---or---
npm install mysql2
```

____

#### Environmentals

Inside the project root directory, open the `.env` file and add the relevant database parameters:

```
DB_HOST = [HOST URL OR IP]
DB_PORT = [PORT NUMBER]
DB_USERNAME = [USERNAME]
DB_PASSWORD = [PASSWORD]
DB_DATABASE = [DATABASE NAME]
```

If you are using something else than MySQL, open the `/app.js` file and replace the database type in the following:

```typescript
await TypeORM.createConnection({
  type:        "mysql", // Replace this
  host:        process.env.DB_HOST,
  port:        +(process.env.DB_PORT || 0),
  username:    process.env.DB_USERNAME,
  password:    process.env.DB_PASSWORD,
  database:    process.env.DB_DATABASE,
  synchronize: true,
  logging:     process.env.NODE_ENV === "development" ? ["error"] : [],
  entities:    [
    Path.resolve(__dirname, "entities", "**/*.ts"),
  ],
});
```

____

#### Entities

Entities should exist inside the `/entities` folder and follow the TypeORM standards.

## [Redis](https://redis.io/)

To set up redis locally, it either needs to be installed locally on a linux machine or installed through WSL on a Windows 10 machine.

### Windows

____

#### Prerequisite:

WSL installed on the Windows machine.

____

#### Installation:

Open up the Ubuntu terminal and enter the following command:

```
sudo apt-get install redis-server
```

____

#### Setting up password:

Enter the `/etc/redis/redis.conf` file and find the following line `# requirepass foobared`.

Replace this line with `requirepass [YOUR PASSWORD]` to set up redis with a password.

____

#### Setting up Redis as a service:

With WSL it is not possible to reliably start the redis-server with a Ubuntu-based daemon, and instead we will start it with a `.vbs` script.

Open up a CMD prompt or PowerShell window and enter the following command to enter the startup programs folder:

```
shell:startup
```

Inside this folder, create a `redis-server.vbs` file, open it, and add the following code:

```
Set oShell = CreateObject("WScript.Shell")
oShell.Run "wsl", 0
oShell.Run "bash -c ""sudo service redis-server start"""
```

Save and close the file.

The command run by the `.vbs` script will not run by itself as it requires a password with the `sudo` rights. To avoid this problem we need to add the command to the `sudoer` file.

Inside the Ubuntu terminal, enter the following command to open the `sudoer` file:

```
sudo visudo
```

Add the following line to the bottom of the file:

```
[YOUR USERNAME] ALL=(ALL:ALL) NOPASSWD:/usr/sbin/service redis-server start
```

Your username can be found with the `whoami` command.

Close the file and save the changes.

____

#### Updating environmentals

Inside project root directory, open the `.env` file and add the password which you specified to the `redis.conf` file.

____

#### Setting up Nginx with subdomains

Edit yours hosts file to add:

```
127.0.0.1 localhost
127.0.0.1 api.localhost
127.0.0.1 files.localhost
```

On windows add the following script to start Nginx on reboot:

```
Set oShell = CreateObject("WScript.Shell")
oShell.Run "wsl", 0
oShell.Run "bash -c ""sudo service nginx start"""
```

Edit your Nginx config file to include the following:

```
server {
    listen          [::]:80;
    server_name     localhost;
    location / {
        proxy_set_header        Host            $http_host;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass                              http://127.0.0.1:40080/;
    }
}

server {
    listen          [::]:80;
    server_name     api.localhost;
    location / {
        proxy_set_header        Host            $http_host;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass                              http://127.0.0.1:40491/;
    }
}

server {
    listen          [::]:80;
    server_name     files.localhost;
    location / {
        proxy_set_header        Host            $http_host;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass                              http://127.0.0.1:41735/;
    }
}
```
