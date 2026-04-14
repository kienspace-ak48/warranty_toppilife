const path = require('path');
const rootPath = path.resolve(__dirname, '../..');
const envPath = path.resolve(rootPath, '.env');
const srcPath = path.resolve(rootPath, 'src');
const publicPath = path.resolve(rootPath, 'public');
const viewsPath = path.resolve(rootPath, 'src/views');
const layoutsPath = path.resolve(rootPath, 'src/views/layouts');
const configsPath = path.resolve(rootPath, 'src/configs');
const modelsPath = path.resolve(rootPath, 'src/models');
const routesPath = path.resolve(rootPath, 'src/routes');
const utilsPath = path.resolve(rootPath, 'src/utils');
const middlewaresPath = path.resolve(rootPath, 'src/middlewares');
const servicesPath = path.resolve(rootPath, 'src/services');
const controllersPath = path.resolve(rootPath, 'src/controllers');

module.exports = {
    envPath,
    rootPath,
    srcPath,
    publicPath,
    viewsPath,
    layoutsPath,
    configsPath,
    modelsPath,
    routesPath,
    utilsPath,
    middlewaresPath,
    servicesPath,
    controllersPath
};