# gses4-case

Small API for checking the USD to UAH exchange rate with the option to subscribe to daily email newsletter with exchange rate information

Documentation may be found [here](https://github.com/Falko05/se_school/blob/main/gses2swagger.yaml) as the swagger.yaml file

The source of information about the exchange rate is [bank.gov.ua](https://bank.gov.ua/)

## Install
1. Clone the repository
```
git clone https://github.com/YaroslavEls/gses4-case.git
```
2. Go to the created directory
```
cd ./gses4-case
```
3. Run the app using docker (the container will be mapped to port 3000 on your machine)
```
docker compose up --build
```
4. Check the application is working
```
curl http://localhost:3000/rate
```

## Dependencies
- [Fastify](https://fastify.dev/) - main framework for building the server
- [sqlite3](https://www.npmjs.com/package/sqlite3) - module for operating SQLite3 database
- [nodemailer](https://nodemailer.com/) - module for emails sending
- [node-cron](https://www.npmjs.com/package/node-cron) - module for tasks scheduling

Full dependency list may be found in [package.json](package.json)