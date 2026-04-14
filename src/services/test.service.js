const CNAME = "test.service.js ";
class TestService {
    constructor() {
        console.log(CNAME +"initialized");
    }
    async add(test){
        try {
            const newTest = await Test.create(test);
            return true;
        } catch (error) {
            console.error(CNAME +"error adding test", error);
            return false;
        }
    }
    async getById(id){}
    async getAll(){}
    async update(id, test){
        try{
            const updatedTest = await Test.findByIdAndUpdate(id, test, {new: true});
            return updatedTest;
        } catch (error) {
            console.error(CNAME +"error updating test", error);
            return false;
        }
    }
    async delete(id){
        try{
            const deletedTest = await Test.findByIdAndDelete(id);
            return deletedTest;
        } catch (error) {
            console.error(CNAME +"error deleting test", error);
            return false;
        }
    }
}

module.exports = new TestService();