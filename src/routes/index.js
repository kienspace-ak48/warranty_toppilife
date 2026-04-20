const clientRoute = require('./client.route');
const adminRoute = require('./admin.route');
const authRoute = require('./auth.route');
const authMiddleware = require('../middlewares/authenticate.middleware');

function registerRoutes(app){
    app.use('/auth', authRoute);
    app.use('/admin', authMiddleware, adminRoute);
    app.use('/', clientRoute);

    app.use((req, res, next) => {
        res.status(404).render('page/notfound', {layout: false});
    });
}

module.exports = registerRoutes;