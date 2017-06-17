# Challenges ASN NdH XV #

Site web sur lequel valider les flags et voir le leader board des challenges de l'Association Sans Nom pour gagner quelques places à la Nuit du Hack

## Install ##

Create a 42 app.

Copy `.env.sample` to `.env` and edit it.

```
npm install
./install_db.js
```

- Development
  ```
  ./fake_data.js
  ```

- Production
  ```
  ./populate_db.js
  ```

## Run ##

```
node ./bin/www
```
