const clientRoute = require('./client.route');
const adminRoute = require('./admin.route');

function registerRoutes(app){
    app.use('/admin', adminRoute);
    app.use('/', clientRoute);

    app.use((req, res, next) => {
        res.status(404).render('page/notfound', {layout: false});
    });
}

module.exports = registerRoutes;