const path = require('path');
const multer = require('multer');
const { memoryStorage } = require('multer');

let filetypes;
// Set The Storage Engine
const storage = multer.diskStorage({
	destination: 'public/upload/',
	filename: function (req, file, cb) {
		let uniqueFile =
			file.fieldname + '-' + Date.now() + path.extname(file.originalname);
		//req.body.filePath = `./public/upload/${uniqueFile}`;
		cb(null, uniqueFile);
	},
});

// Init Upload
const upload = multer({
	storage: memoryStorage(),
	//storage: storage,
	limits: { fileSize: 1048576 },
	fileFilter: function (req, file, cb) {
		checkFileType(file, cb);
	},
}).array('File', 3);

// Check File Type
function checkFileType(file, cb) {
	// const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	// const mimetype = filetypes.test(file.mimetype);
	// if (mimetype && extname) {
	// 	return cb(null, true);
	// }
	if (
		file.mimetype.startsWith('image') ||
		file.mimetype.startsWith('application') ||
		file.mimetype.startsWith('text')
	) {
		return cb(null, true);
	} else {
		cb('Error: Documents only e.g (Text or Documents files are valid)!', false);
	}
}

module.exports = (req, res, next) => {
	if (req.originalUrl.includes('/file')) {
		filetypes = /text\/csv|csv/;
	} else if (req.originalUrl.includes('/file')) {
		filetypes = /text\/html|html/;
	} else {
		filetypes =
			/text\/plain|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|txt|doc|docx/;
	}
	filetypes =
		/text\/plain|text\/html|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|txt|doc|docx|html/;
	upload(req, res, (e) => {
		console.log(e);
		if (e) {
			return res.status(400).send({
				success: false,
				message: e,
			});
		}
		if (req.file == undefined) {
			next();
		} else {
			next();
		}
	});
	// }
};
