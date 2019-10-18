# Github Integration Server
Simple node server to push files to github branches using github api. 
Requires you to use [github api token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)

### Prerequisites 
- node
- npm

### Installations
`npm install`

### Running Instructions

#### development
1. create .env file with changes for you using envExample
2. change the files list and paths in filesConfig.js
3. run `npm run push-dev` or `npm run push-master`

#### production

1. set env variable `GITHUB_API_TOKEN`
2. make changes as required to `run.sh` 
3. run `sh run.sh push-dev` for push to develop branch or `sh run.sh push-master`for push to master branch
