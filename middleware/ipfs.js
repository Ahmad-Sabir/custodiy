const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
const ipfsModule = async (req, res, next) => {
    try {
        if (req.files && req.files.length > 0) {
            let files = req.files.map(async (e) => {
                const file = await ipfs.files.add(e.buffer);
                return `https://gateway.ipfs.io/ipfs/${file[0].hash}`;
            });
            req.body.files = await Promise.all(files);
            console.log(req.body.files);
        }
        return next();
    } catch (e) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: 'Failed in file upload',
        });
    }
};

module.exports = ipfsModule;
