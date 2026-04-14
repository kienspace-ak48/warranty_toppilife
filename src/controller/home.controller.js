const CNAME = "home.controller.js ";
const testService = require('../services/test.service');
const warrantyService = require('../services/warrantyService');

const homeController = ()=>{
    return {
        Index: async(req, res)=>{
            const productTypes = await warrantyService.getProductTypesForSerialGuideShowcase();
            res.render('home/index', {
                layout: 'layouts/main',
                title: 'Tra cứu bảo hành — ToppiLife',
                tab: 'lookup',
                productTypes,
            });
        },
        Test: async(req, res)=>{
            try {
                const test = await testService.add({name: 'Test', description: 'Test'});
                if(test){
                    res.json({success: true, message: 'Test added successfully'});
                }else{
                    res.json({success: false, message: 'Failed to add test'});
                }
            } catch (error) {
                res.json({success: false, message: 'Failed to add test', error: error.message});
            }
        }
    }
}

module.exports = homeController;